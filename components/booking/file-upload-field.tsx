'use client';

import { memo, useCallback, useId, useMemo, useRef, useState, type DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import type { CheckoutQuestionResponse } from '@opencals/storefront-sdk';
import { EASE_OUT } from '@/components/motion/easing';
import { fileRulesFor, type FileUploads, type UploadItem } from '@/hooks/use-file-upload';

interface FileUploadFieldProps {
	question: CheckoutQuestionResponse;
	uploads: FileUploads;
	/** id of the visible label, for aria-labelledby. */
	labelId: string;
}

const ROW_INITIAL = { opacity: 0, y: 6 };
const ROW_ANIMATE = { opacity: 1, y: 0 };
const ROW_EXIT = { opacity: 0, y: -4 };
const ROW_TRANSITION = { duration: 0.35, ease: EASE_OUT };
const NO_TRANSITION = { duration: 0 };

function formatSize(bytes: number): string {
	if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Drop zone + file list for one `file-upload` checkout question. Validates type,
 * size and count against the question's `fileConfig` (with a photo-or-PDF,
 * 10 MB fallback), then uploads straight to S3 with progress. Each file can be
 * removed, replaced or retried.
 */
export function FileUploadField({ question, uploads, labelId }: FileUploadFieldProps) {
	const reduce = useReducedMotion();
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const replaceRef = useRef<string | null>(null);
	const [dragging, setDragging] = useState(false);
	const [rejections, setRejections] = useState<string[]>([]);

	const rules = useMemo(() => fileRulesFor(question), [question]);
	const items = uploads.uploads[question.id] ?? [];
	const full = items.length >= rules.maxFiles;

	const take = useCallback(
		(files: FileList | File[] | null) => {
			if (!files || files.length === 0) return;
			const replaceKey = replaceRef.current ?? undefined;
			replaceRef.current = null;
			setRejections(uploads.addFiles(question, files, replaceKey));
		},
		[uploads, question],
	);

	const openPicker = useCallback((replaceKey: string | null = null) => {
		replaceRef.current = replaceKey;
		if (inputRef.current) {
			inputRef.current.multiple = replaceKey === null && rules.maxFiles > 1;
			inputRef.current.click();
		}
	}, [rules.maxFiles]);

	const onDrop = useCallback(
		(e: DragEvent<HTMLButtonElement>) => {
			e.preventDefault();
			setDragging(false);
			replaceRef.current = null;
			take(e.dataTransfer.files);
		},
		[take],
	);

	return (
		<div className="space-y-3">
			<input
				ref={inputRef}
				id={inputId}
				type="file"
				accept={rules.accept}
				className="sr-only"
				tabIndex={-1}
				aria-hidden
				onChange={(e) => {
					take(e.target.files);
					e.target.value = '';
				}}
			/>

			{full ? null : (
				<button
					type="button"
					aria-labelledby={labelId}
					aria-describedby={`${inputId}-hint`}
					onClick={() => openPicker(null)}
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={onDrop}
					className={clsx(
						'group flex w-full flex-col items-center justify-center gap-2 border border-dashed px-5 py-7 text-center transition-colors duration-300',
						'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
						dragging
							? 'border-[var(--color-primary)] bg-[var(--color-tint)]'
							: 'border-[var(--color-line-strong)] bg-[var(--color-bg)] hover:border-[var(--color-primary)]',
					)}
				>
					<svg className="h-5 w-5 text-[var(--color-primary)]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden>
						<path d="M10 13V3m0 0L6 7m4-4l4 4M3 13v4h14v-4" strokeLinecap="square" />
					</svg>
					<span className="text-[0.7rem] uppercase tracking-[0.24em] text-[var(--color-ink)]">
						{items.length > 0 ? 'Add another file' : 'Upload a photo or scan'}
					</span>
					<span id={`${inputId}-hint`} className="tabular text-[0.68rem] text-[var(--color-ink-dim)]">
						{rules.hint}
					</span>
				</button>
			)}

			<ul className="space-y-2" aria-live="polite">
				<AnimatePresence initial={false}>
					{items.map((item) => (
						<motion.li
							key={item.key}
							initial={reduce ? false : ROW_INITIAL}
							animate={ROW_ANIMATE}
							exit={reduce ? undefined : ROW_EXIT}
							transition={reduce ? NO_TRANSITION : ROW_TRANSITION}
						>
							<UploadRow
								item={item}
								onRemove={() => uploads.remove(question.id, item.key)}
								onReplace={() => openPicker(item.key)}
								onRetry={() => uploads.retry(question.id, item.key)}
							/>
						</motion.li>
					))}
				</AnimatePresence>
			</ul>

			{rejections.length > 0 ? (
				<ul role="alert" className="space-y-1 text-xs text-[#E5787A]">
					{rejections.map((r) => (
						<li key={r}>{r}</li>
					))}
				</ul>
			) : null}
		</div>
	);
}

interface UploadRowProps {
	item: UploadItem;
	onRemove: () => void;
	onReplace: () => void;
	onRetry: () => void;
}

const UploadRow = memo(function UploadRow({ item, onRemove, onReplace, onRetry }: UploadRowProps) {
	const pct = Math.round(item.progress * 100);
	return (
		<div className="relative overflow-hidden border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3">
			{item.status === 'uploading' ? (
				<span
					aria-hidden
					className="absolute inset-y-0 left-0 bg-[var(--color-tint)] transition-[width] duration-200"
					style={{ width: `${pct}%` }}
				/>
			) : null}
			<div className="relative flex items-center gap-3">
				<StatusMark status={item.status} />
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm text-[var(--color-ink)]">{item.filename}</p>
					<p
						className={clsx(
							'tabular text-[0.68rem]',
							item.status === 'error' ? 'text-[#E5787A]' : 'text-[var(--color-ink-dim)]',
						)}
					>
						{item.status === 'uploading'
							? `Uploading · ${pct}%`
							: item.status === 'error'
								? item.error
								: `${formatSize(item.size)} · Uploaded`}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-3 text-[0.64rem] uppercase tracking-[0.2em]">
					{item.status === 'error' ? (
						<button type="button" onClick={onRetry} className="text-[var(--color-primary)] hover:text-[var(--color-primary-bright)]">
							Retry
						</button>
					) : null}
					{item.status === 'done' ? (
						<button type="button" onClick={onReplace} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
							Replace
						</button>
					) : null}
					<button
						type="button"
						onClick={onRemove}
						aria-label={`Remove ${item.filename}`}
						className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
					>
						{item.status === 'uploading' ? 'Cancel' : 'Remove'}
					</button>
				</div>
			</div>
		</div>
	);
});

function StatusMark({ status }: { status: UploadItem['status'] }) {
	if (status === 'done') {
		return (
			<span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--color-primary)] text-black" aria-label="Uploaded">
				<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
					<path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="square" />
				</svg>
			</span>
		);
	}
	if (status === 'error') {
		return (
			<span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#E5787A] text-[#E5787A]" aria-label="Failed">
				!
			</span>
		);
	}
	return (
		<span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--color-line-strong)]" aria-label="Uploading">
			<span className="h-3 w-3 animate-spin border border-[var(--color-primary)] border-t-transparent" />
		</span>
	);
}
