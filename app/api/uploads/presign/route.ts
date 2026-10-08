import '@/lib/opencals';
import { CustomerUploadService } from '@opencals/storefront-sdk';
import { getAccessToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';

/** Hard ceiling regardless of the question's own limit (the backend enforces the real one). */
const MAX_BYTES = 50 * 1024 * 1024;

interface PresignInput {
	questionId?: unknown;
	filename?: unknown;
	mime?: unknown;
	size?: unknown;
}

/**
 * Step 1 of a checkout file upload (driving licence, passport…).
 *
 * POST { questionId, filename, mime, size } → { fileId, presignedUrl, expiresIn }
 *
 * The backend checks `mime` against the question's `fileConfig.categories` and
 * `size` against `maxSizeBytes`, creates the file record and signs an S3 PUT.
 * The browser then PUTs the bytes straight to `presignedUrl` with the SAME
 * `Content-Type` (the signature covers it) and sends `fileIds: [fileId]` with
 * the answer via `/api/book` → `CheckoutService.saveAnswers`.
 */
export async function POST(request: NextRequest) {
	let input: PresignInput;
	try {
		input = (await request.json()) as PresignInput;
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { questionId, filename, mime, size } = input;
	if (typeof questionId !== 'string' || !questionId) {
		return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
	}
	if (typeof filename !== 'string' || !filename.trim() || filename.length > 255) {
		return NextResponse.json({ error: 'A valid filename is required' }, { status: 400 });
	}
	if (typeof mime !== 'string' || !/^[\w.+-]+\/[\w.+-]+$/.test(mime)) {
		return NextResponse.json({ error: 'A valid file type is required' }, { status: 400 });
	}
	if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0 || size > MAX_BYTES) {
		return NextResponse.json({ error: 'File is empty or too large' }, { status: 400 });
	}

	try {
		const token = await getAccessToken();
		const { data } = await CustomerUploadService.presign({
			body: { questionId, questionKind: 'checkout', filename: filename.trim(), mime, size },
			...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
			throwOnError: true,
		});
		return NextResponse.json({
			fileId: data.fileId,
			presignedUrl: data.presignedUrl,
			expiresIn: data.expiresIn,
		});
	} catch (err) {
		return handleApiError(err, 'Could not prepare the upload');
	}
}
