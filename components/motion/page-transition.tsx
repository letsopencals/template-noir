'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { DURATION, EASE_OUT } from './easing';

const INITIAL = { opacity: 0, y: 14 } as const;
const ANIMATE = { opacity: 1, y: 0 } as const;
const TRANSITION = { duration: DURATION.base, ease: EASE_OUT } as const;
const CURTAIN_INITIAL = { scaleY: 1 } as const;
const CURTAIN_ANIMATE = { scaleY: 0 } as const;
const CURTAIN_TRANSITION = { duration: DURATION.base, ease: EASE_OUT, delay: 0.05 } as const;

/**
 * Enter transition for every route. Mounted by app/template.tsx, which Next
 * re-mounts on navigation: a thin black curtain lifts off the top and the page
 * rises in. Reduced motion: `initial={false}` starts both at their end state.
 * The tree is the same either way, because `useReducedMotion` is null on the
 * server and an early return would cause a hydration mismatch.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
	const reduce = useReducedMotion();
	return (
		<>
			<motion.div
				aria-hidden
				className="pointer-events-none fixed inset-0 z-[70] origin-top bg-[var(--color-bg-deep)]"
				initial={reduce ? false : CURTAIN_INITIAL}
				animate={CURTAIN_ANIMATE}
				transition={CURTAIN_TRANSITION}
			/>
			<motion.div initial={reduce ? false : INITIAL} animate={ANIMATE} transition={TRANSITION}>
				{children}
			</motion.div>
		</>
	);
}
