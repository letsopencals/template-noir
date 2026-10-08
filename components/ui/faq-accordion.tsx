'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { DURATION, EASE_OUT } from '@/components/motion/easing';

export interface FaqItem {
	q: string;
	a: string;
}

const PANEL_TRANSITION = { duration: DURATION.fast, ease: EASE_OUT };
const PANEL_INITIAL = { height: 0, opacity: 0 };
const PANEL_OPEN = { height: 'auto', opacity: 1 };

/** Hairline-ruled FAQ list: numbered rows, squared plus icon that turns into a minus. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
	const [openIndex, setOpenIndex] = useState<number | null>(0);
	const baseId = useId();

	return (
		<div className="border-t border-[var(--color-line)]">
			{items.map((item, i) => {
				const isOpen = openIndex === i;
				const panelId = `${baseId}-panel-${i}`;
				return (
					<div key={item.q} className="border-b border-[var(--color-line)]">
						<button
							type="button"
							onClick={() => setOpenIndex(isOpen ? null : i)}
							aria-expanded={isOpen}
							aria-controls={panelId}
							className="group flex w-full items-baseline gap-6 py-6 text-left"
						>
							<span className="w-8 shrink-0 font-mono text-xs tabular-nums text-[var(--color-ink-dim)]">
								{String(i + 1).padStart(2, '0')}
							</span>
							<span
								className={`flex-1 text-base transition-colors md:text-lg ${
									isOpen
										? 'text-[var(--color-primary)]'
										: 'text-[var(--color-ink)] group-hover:text-[var(--color-primary)]'
								}`}
							>
								{item.q}
							</span>
							<span
								aria-hidden
								className={`relative flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-[2px] border transition-colors ${
									isOpen
										? 'border-[var(--color-primary)] text-[var(--color-primary)]'
										: 'border-[var(--color-line-strong)] text-[var(--color-ink-muted)]'
								}`}
							>
								<span className="absolute h-px w-3 bg-current" />
								<span
									className={`absolute h-3 w-px bg-current transition-transform duration-300 ${isOpen ? 'scale-y-0' : 'scale-y-100'}`}
								/>
							</span>
						</button>
						<AnimatePresence initial={false}>
							{isOpen && (
								<motion.div
									id={panelId}
									initial={PANEL_INITIAL}
									animate={PANEL_OPEN}
									exit={PANEL_INITIAL}
									transition={PANEL_TRANSITION}
									className="overflow-hidden"
								>
									<p className="max-w-2xl pb-7 pl-14 text-sm leading-relaxed text-[var(--color-ink-muted)] md:text-base">
										{item.a}
									</p>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				);
			})}
		</div>
	);
}
