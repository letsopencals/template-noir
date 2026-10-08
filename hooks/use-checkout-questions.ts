'use client';

import useSWR from 'swr';
import type { CheckoutQuestionResponse as CheckoutQuestion } from '@opencals/storefront-sdk';
import { fetcher } from '@/lib/fetcher';

/**
 * Checkout questions for a product, keyed by slug. Split out of use-booking-flow
 * so the flow hook orchestrates rather than fetches.
 */
export function useCheckoutQuestions(slug: string | null): CheckoutQuestion[] {
	const { data } = useSWR<CheckoutQuestion[]>(
		slug ? `/api/products/${slug}/questions?language=en` : null,
		fetcher,
		{ revalidateOnFocus: false },
	);
	return Array.isArray(data) ? data : [];
}

/**
 * True when every required question has an answer: checkboxes must be ticked
 * ('true'), file-upload questions need at least one finished upload, and text,
 * dropdown and rating questions need a non-blank value.
 */
export function questionsComplete(
	questions: readonly CheckoutQuestion[],
	answers: Record<string, string>,
	fileIdsFor: (questionId: string) => string[] = () => [],
): boolean {
	return questions.every((q) => {
		if (!q.required) return true;
		if (q.type === 'file-upload') return fileIdsFor(q.id).length > 0;
		const v = answers[q.id];
		if (q.type === 'checkbox') return v === 'true';
		return v != null && v.trim().length > 0;
	});
}

/** The display title for a question (first translation, else the internal name). */
export function questionTitle(q: CheckoutQuestion): string {
	return q.translations?.[0]?.title ?? q.internalName;
}

/**
 * Answers in the shape `/api/book` expects. File-upload answers carry
 * `fileIds` and the joined filenames as the readable `answer`.
 */
export function buildAnswerPayload(
	questions: readonly CheckoutQuestion[],
	answers: Record<string, string>,
	files: { fileIdsFor: (id: string) => string[]; filenamesFor: (id: string) => string[] } | null,
): Array<{ questionId: string; question: string; answer: string; fileIds?: string[] }> {
	const out: Array<{ questionId: string; question: string; answer: string; fileIds?: string[] }> = [];
	for (const q of questions) {
		if (q.type === 'file-upload') {
			const fileIds = files?.fileIdsFor(q.id) ?? [];
			if (fileIds.length === 0) continue;
			out.push({ questionId: q.id, question: questionTitle(q), answer: (files?.filenamesFor(q.id) ?? []).join(', '), fileIds });
			continue;
		}
		const v = answers[q.id];
		if (v == null || v.trim() === '') continue;
		out.push({ questionId: q.id, question: questionTitle(q), answer: v.trim() });
	}
	return out;
}
