/**
 * Shared motion constants. Every motion component imports from here so the site
 * moves with one voice: long, decelerating eases (no bounce), short distances.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const DURATION = {
	fast: 0.35,
	base: 0.7,
	slow: 1.1,
	drive: 1.4,
} as const;

/** Default viewport config for whileInView reveals: play once, slightly before fully in view. */
export const VIEWPORT_ONCE = { once: true, margin: '0px 0px -12% 0px' } as const;
