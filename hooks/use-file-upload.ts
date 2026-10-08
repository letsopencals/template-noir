'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CheckoutQuestionResponse } from '@opencals/storefront-sdk';

/* ----------------------------------------------------------- file config */

export type FileCategory = 'images' | 'pdf' | 'audio' | 'video' | 'documents' | 'archives';

export interface FileRules {
	categories: FileCategory[];
	maxSizeBytes: number;
	maxFiles: number;
	/** Flattened MIME allowlist for the categories. */
	mimes: string[];
	/** `accept` attribute for the file input. */
	accept: string;
	/** Human hint, e.g. "JPG, PNG or PDF · up to 10 MB · 2 files". */
	hint: string;
}

/** Mirrors the backend's MIME allowlist per category (customer-upload validation). */
const CATEGORY_MIMES: Record<FileCategory, string[]> = {
	images: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'],
	pdf: ['application/pdf'],
	audio: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/aac'],
	video: ['video/mp4', 'video/quicktime', 'video/webm'],
	documents: [
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/vnd.ms-powerpoint',
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		'text/plain',
		'text/csv',
	],
	archives: ['application/zip', 'application/x-zip-compressed'],
};

const CATEGORY_LABELS: Record<FileCategory, string> = {
	images: 'JPG, PNG, HEIC',
	pdf: 'PDF',
	audio: 'audio',
	video: 'video',
	documents: 'Word, Excel, text',
	archives: 'ZIP',
};

/** Browsers often report HEIC as '' — infer from the extension so the signed type matches. */
const EXTENSION_MIMES: Record<string, string> = {
	heic: 'image/heic',
	heif: 'image/heif',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	pdf: 'application/pdf',
};

/**
 * Used when a question has no `fileConfig` (e.g. a store seeded without one):
 * ID scans as photos or PDF, 10 MB each, front and back.
 */
const DEFAULT_CONFIG = { categories: ['images', 'pdf'] as FileCategory[], maxSizeBytes: 10 * 1024 * 1024, maxFiles: 2 };

function formatBytes(bytes: number): string {
	if (bytes >= 1024 * 1024) return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
	return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function fileRulesFor(question: Pick<CheckoutQuestionResponse, 'fileConfig'>): FileRules {
	const cfg = (question.fileConfig ?? null) as {
		categories?: unknown;
		maxSizeBytes?: unknown;
		maxFiles?: unknown;
	} | null;
	const categories = Array.isArray(cfg?.categories)
		? (cfg.categories.filter((c): c is FileCategory => typeof c === 'string' && c in CATEGORY_MIMES) as FileCategory[])
		: [];
	const resolved = categories.length > 0 ? categories : DEFAULT_CONFIG.categories;
	const maxSizeBytes =
		typeof cfg?.maxSizeBytes === 'number' && cfg.maxSizeBytes > 0 ? cfg.maxSizeBytes : DEFAULT_CONFIG.maxSizeBytes;
	const maxFiles = typeof cfg?.maxFiles === 'number' && cfg.maxFiles > 0 ? cfg.maxFiles : DEFAULT_CONFIG.maxFiles;
	const mimes = resolved.flatMap((c) => CATEGORY_MIMES[c]);
	const extensions = resolved.includes('images') ? ['.heic', '.heif'] : [];
	const labels = resolved.map((c) => CATEGORY_LABELS[c]);
	const typeLabel = labels.length > 1 ? `${labels.slice(0, -1).join(', ')} or ${labels[labels.length - 1]}` : labels[0];
	return {
		categories: resolved,
		maxSizeBytes,
		maxFiles,
		mimes,
		accept: [...mimes, ...extensions].join(','),
		hint: `${typeLabel} · up to ${formatBytes(maxSizeBytes)}${maxFiles > 1 ? ` · ${maxFiles} files` : ''}`,
	};
}

export function resolveMime(file: File): string {
	if (file.type) return file.type;
	const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
	return EXTENSION_MIMES[ext] ?? 'application/octet-stream';
}

/* ---------------------------------------------------------------- state */

export type UploadStatus = 'uploading' | 'done' | 'error';

export interface UploadItem {
	/** Local key (stable across status changes). */
	key: string;
	filename: string;
	size: number;
	mime: string;
	status: UploadStatus;
	/** 0..1 */
	progress: number;
	/** Set once the presign step succeeds. */
	fileId: string | null;
	error: string | null;
	/** Kept for retry; never sent anywhere but S3. */
	file: File;
}

export type UploadsByQuestion = Record<string, UploadItem[]>;

interface PresignResponse {
	fileId: string;
	presignedUrl: string;
	expiresIn: number;
}

let keySeq = 0;
const nextKey = () => `up-${Date.now().toString(36)}-${(keySeq++).toString(36)}`;

/** PUT with XHR (fetch has no upload progress). Content-Type must equal the signed mime. */
function putWithProgress(url: string, file: File, mime: string, onProgress: (p: number) => void, signal: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('PUT', url);
		xhr.setRequestHeader('Content-Type', mime);
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) onProgress(e.loaded / e.total);
		};
		xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
		xhr.onerror = () => reject(new Error('Network error during upload'));
		xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
		signal.addEventListener('abort', () => xhr.abort(), { once: true });
		xhr.send(file);
	});
}

/**
 * Checkout file uploads, per question:
 *   validate (type, size, count) → POST /api/uploads/presign → XHR PUT to S3 (progress)
 * Each file ends `done` with a `fileId`, or `error` with a message and a retry.
 * `fileIdsFor(questionId)` gives the ids to send with the answer.
 */
export function useFileUploads() {
	const [uploads, setUploads] = useState<UploadsByQuestion>({});
	const controllers = useRef(new Map<string, AbortController>());
	const uploadsRef = useRef(uploads);
	useEffect(() => {
		uploadsRef.current = uploads;
	}, [uploads]);

	useEffect(() => {
		const map = controllers.current;
		return () => {
			for (const c of map.values()) c.abort();
			map.clear();
		};
	}, []);

	const patch = useCallback((questionId: string, key: string, change: Partial<UploadItem>) => {
		setUploads((prev) => {
			const list = prev[questionId];
			if (!list) return prev;
			return { ...prev, [questionId]: list.map((u) => (u.key === key ? { ...u, ...change } : u)) };
		});
	}, []);

	/** presign → PUT. Patches progress/status; resolves with the fileId, rejects on failure. */
	const uploadOnce = useCallback(
		async (questionId: string, item: UploadItem): Promise<string> => {
			const controller = new AbortController();
			controllers.current.set(item.key, controller);
			try {
				const res = await fetch('/api/uploads/presign', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ questionId, filename: item.filename, mime: item.mime, size: item.size }),
					signal: controller.signal,
				});
				const data = (await res.json().catch(() => null)) as (PresignResponse & { error?: string }) | null;
				if (!res.ok || !data?.presignedUrl) throw new Error(data?.error || 'Could not prepare the upload');
				await putWithProgress(
					data.presignedUrl,
					item.file,
					item.mime,
					(p) => patch(questionId, item.key, { progress: p }),
					controller.signal,
				);
				patch(questionId, item.key, { status: 'done', progress: 1, fileId: data.fileId, error: null });
				return data.fileId;
			} catch (err) {
				if (!(err instanceof DOMException && err.name === 'AbortError')) {
					patch(questionId, item.key, {
						status: 'error',
						error: err instanceof Error ? err.message : 'Upload failed',
					});
				}
				throw err;
			} finally {
				controllers.current.delete(item.key);
			}
		},
		[patch],
	);

	const run = useCallback(
		(questionId: string, item: UploadItem) => {
			uploadOnce(questionId, item).catch(() => {
				// State already carries the error.
			});
		},
		[uploadOnce],
	);

	/**
	 * Validate and start uploading. With `replaceKey`, the new file takes that
	 * item's place. Returns validation messages for rejected files.
	 */
	const addFiles = useCallback(
		(question: CheckoutQuestionResponse, files: FileList | File[], replaceKey?: string): string[] => {
			const rules = fileRulesFor(question);
			const current = (uploads[question.id] ?? []).filter((u) => u.key !== replaceKey);
			const room = Math.max(0, rules.maxFiles - current.length);
			const rejected: string[] = [];
			const accepted: UploadItem[] = [];

			for (const file of Array.from(files)) {
				const mime = resolveMime(file);
				if (!rules.mimes.includes(mime)) {
					rejected.push(`${file.name}: this file type isn't accepted.`);
				} else if (file.size > rules.maxSizeBytes) {
					rejected.push(`${file.name}: larger than ${formatBytes(rules.maxSizeBytes)}.`);
				} else if (file.size === 0) {
					rejected.push(`${file.name}: the file is empty.`);
				} else if (accepted.length >= room) {
					rejected.push(`${file.name}: up to ${rules.maxFiles} ${rules.maxFiles === 1 ? 'file' : 'files'} here.`);
				} else {
					accepted.push({
						key: nextKey(),
						filename: file.name,
						size: file.size,
						mime,
						status: 'uploading',
						progress: 0,
						fileId: null,
						error: null,
						file,
					});
				}
			}

			if (replaceKey) controllers.current.get(replaceKey)?.abort();
			if (accepted.length > 0 || replaceKey) {
				setUploads((prev) => {
					const list = prev[question.id] ?? [];
					const idx = replaceKey ? list.findIndex((u) => u.key === replaceKey) : -1;
					const next =
						idx >= 0
							? [...list.slice(0, idx), ...accepted, ...list.slice(idx + 1)]
							: [...list.filter((u) => u.key !== replaceKey), ...accepted];
					return { ...prev, [question.id]: next };
				});
			}
			for (const item of accepted) run(question.id, item);
			return rejected;
		},
		[uploads, run],
	);

	const remove = useCallback((questionId: string, key: string) => {
		controllers.current.get(key)?.abort();
		setUploads((prev) => ({ ...prev, [questionId]: (prev[questionId] ?? []).filter((u) => u.key !== key) }));
	}, []);

	const retry = useCallback(
		(questionId: string, key: string) => {
			const item = uploads[questionId]?.find((u) => u.key === key);
			if (!item) return;
			const fresh = { ...item, status: 'uploading' as const, progress: 0, error: null, fileId: null };
			patch(questionId, key, fresh);
			run(questionId, fresh);
		},
		[uploads, patch, run],
	);

	const reset = useCallback(() => {
		for (const c of controllers.current.values()) c.abort();
		controllers.current.clear();
		setUploads({});
	}, []);

	/**
	 * Upload every finished file again and return the fresh ids per question.
	 * The backend links a file to one answer only, so a booking that is
	 * re-created (new dates or extras after reserving) needs new file records.
	 */
	const reuploadAll = useCallback(async (): Promise<Record<string, { fileIds: string[]; filenames: string[] }>> => {
		const out: Record<string, { fileIds: string[]; filenames: string[] }> = {};
		const jobs: Array<Promise<void>> = [];
		for (const [questionId, list] of Object.entries(uploadsRef.current)) {
			for (const item of list) {
				if (item.status !== 'done') continue;
				const fresh = { ...item, status: 'uploading' as const, progress: 0, fileId: null, error: null };
				patch(questionId, item.key, fresh);
				jobs.push(
					uploadOnce(questionId, fresh).then((fileId) => {
						const entry = (out[questionId] ??= { fileIds: [], filenames: [] });
						entry.fileIds.push(fileId);
						entry.filenames.push(item.filename);
					}),
				);
			}
		}
		await Promise.all(jobs);
		return out;
	}, [patch, uploadOnce]);

	const busy = useMemo(() => Object.values(uploads).some((list) => list.some((u) => u.status === 'uploading')), [uploads]);

	const fileIdsFor = useCallback(
		(questionId: string) =>
			(uploads[questionId] ?? []).filter((u) => u.status === 'done' && u.fileId).map((u) => u.fileId as string),
		[uploads],
	);

	const filenamesFor = useCallback(
		(questionId: string) => (uploads[questionId] ?? []).filter((u) => u.status === 'done').map((u) => u.filename),
		[uploads],
	);

	return { uploads, addFiles, remove, retry, reset, reuploadAll, busy, fileIdsFor, filenamesFor };
}

export type FileUploads = ReturnType<typeof useFileUploads>;
