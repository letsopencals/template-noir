// Chauffeur flow (staff-led, with driver selection) — the classic multi-step flow.
export const BOOKING_STEPS = ['when', 'who', 'extras', 'questions', 'details', 'payment'] as const;
export type BookingStep = (typeof BOOKING_STEPS)[number];

export const STEP_LABELS: Record<BookingStep, string> = {
	when: 'When',
	who: 'Chauffeur',
	extras: 'Extras',
	questions: 'Details',
	details: 'Your details',
	payment: 'Payment',
};

// Car-rental flow (Self-rule product, no staff). Car + dates are chosen before
// this flow starts, so it opens on "extras".
export const RENTAL_STEPS = ['dates', 'extras', 'questions', 'details', 'payment'] as const;
export type RentalStep = (typeof RENTAL_STEPS)[number];

export const RENTAL_STEP_LABELS: Record<RentalStep, string> = {
	dates: 'When & where',
	extras: 'Extras',
	questions: 'Documents',
	details: 'Your details',
	payment: 'Payment',
};
