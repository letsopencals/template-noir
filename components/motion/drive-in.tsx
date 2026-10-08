'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import { DURATION, EASE_OUT, VIEWPORT_ONCE } from './easing';

const CAR_TRANSITION = { duration: DURATION.drive, ease: EASE_OUT } as const;
const SHADOW_TRANSITION = { duration: DURATION.drive + 0.2, ease: EASE_OUT } as const;
const CAR_VISIBLE = { x: '0%', filter: 'blur(0px)', opacity: 1 } as const;
const SHADOW_HIDDEN = { scaleX: 0.25, opacity: 0 } as const;
const SHADOW_VISIBLE = { scaleX: 1, opacity: 1 } as const;

export interface DriveInProps {
	/** The car image (e.g. a SafeImage with `fill`, or a sized <img>). */
	children: React.ReactNode;
	className?: string;
	/** Which side the car enters from. Default 'left' (drives to the right). */
	from?: 'left' | 'right';
	/** Horizontal travel as % of the element width. Default 35. */
	distance?: number;
	delay?: number;
	/** 'inView' (default) or 'mount' (hero). */
	trigger?: 'inView' | 'mount';
	/** Render the soft floor shadow under the car. Default true. */
	shadow?: boolean;
}

/**
 * Car "drive-in": the image slides in horizontally with motion blur that
 * resolves to sharp, while a floor shadow stretches out beneath it.
 * Reduced motion: renders in place.
 */
export function DriveIn({
	children,
	className,
	from = 'left',
	distance = 35,
	delay = 0,
	trigger = 'inView',
	shadow = true,
}: DriveInProps) {
	const reduce = useReducedMotion();
	const shadowEl = shadow ? (
		<span
			aria-hidden
			className="pointer-events-none absolute inset-x-[8%] bottom-[4%] h-[9%] rounded-[50%] bg-black/80 blur-xl"
		/>
	) : null;

	if (reduce) {
		return (
			<div className={clsx('relative', className)}>
				{shadowEl}
				<div className="relative h-full w-full">{children}</div>
			</div>
		);
	}

	const hidden = { x: `${from === 'left' ? -distance : distance}%`, filter: 'blur(14px)', opacity: 0 };
	const play =
		trigger === 'mount'
			? { animate: 'visible' as const }
			: { whileInView: 'visible' as const, viewport: VIEWPORT_ONCE };

	return (
		<motion.div className={clsx('relative', className)} initial="hidden" {...play}>
			{shadow ? (
				<motion.span
					aria-hidden
					className="pointer-events-none absolute inset-x-[8%] bottom-[4%] h-[9%] origin-center rounded-[50%] bg-black/80 blur-xl"
					variants={{ hidden: SHADOW_HIDDEN, visible: SHADOW_VISIBLE }}
					transition={{ ...SHADOW_TRANSITION, delay }}
				/>
			) : null}
			<motion.div
				className="relative h-full w-full will-change-transform"
				variants={{ hidden, visible: CAR_VISIBLE }}
				transition={{ ...CAR_TRANSITION, delay }}
			>
				{children}
			</motion.div>
		</motion.div>
	);
}
