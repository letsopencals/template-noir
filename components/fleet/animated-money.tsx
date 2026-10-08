'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import { EASE_OUT } from '@/components/motion/easing';
import { formatMoney } from './fleet-data';

const TWEEN_SECONDS = 0.6;

/**
 * A money figure that tweens from its previous value whenever `value` changes
 * (estimates updating as dates are picked). Mono digits so the width holds
 * steady. Reduced motion: jumps straight to the new value.
 */
export const AnimatedMoney = memo(function AnimatedMoney({
	value,
	currency,
	className,
}: {
	value: number;
	currency: string;
	className?: string;
}) {
	const reduce = useReducedMotion();
	const [display, setDisplay] = useState(value);
	const previous = useRef(value);

	useEffect(() => {
		const from = previous.current;
		previous.current = value;
		if (reduce || from === value) {
			setDisplay(value);
			return;
		}
		const controls = animate(from, value, { duration: TWEEN_SECONDS, ease: EASE_OUT, onUpdate: setDisplay });
		return () => controls.stop();
	}, [value, reduce]);

	return <span className={clsx('tabular', className)}>{formatMoney(display, currency)}</span>;
});
