'use client';

import { useId, useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import type { AvailabilityRange } from '@/lib/rental';
import { siteConfig } from '@/lib/site-config';
import { RangeCalendar } from '@/components/rental/range-calendar';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EASE_OUT } from '@/components/motion/easing';
import type { RentalHandover, HandoverMode } from '@/hooks/use-rental-handover';
import type { BookCar } from './book-car';
import { ChoiceChips } from './choice-chips';

interface WhenWhereProps {
	car: BookCar;
	handover: RentalHandover;
	ranges: AvailabilityRange[];
	rangesLoading: boolean;
	/** False when the picked dates are no longer free for this car. */
	datesFit: boolean;
	slotTaken: boolean;
	canContinue: boolean;
	onContinue: () => void;
}

const FIELD_LABEL = 'mb-2 block text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)]';
const SUB_HEAD = 'mb-4 text-[0.68rem] uppercase tracking-[0.24em] text-[var(--color-ink-dim)]';
const UNFOLD_INITIAL = { height: 0, opacity: 0 };
const UNFOLD_ANIMATE = { height: 'auto', opacity: 1 };
const UNFOLD_TRANSITION = { duration: 0.5, ease: EASE_OUT };
const NO_TRANSITION = { duration: 0 };
const TIME_OPTIONS = siteConfig.handoverTimes.map((t) => ({ value: t, label: t }));

/** Step 01: dates, handover / return windows, and deliver-vs-collect. */
export function WhenWhere({ car, handover: h, ranges, rangesLoading, datesFit, slotTaken, canContinue, onContinue }: WhenWhereProps) {
	const modeOptions = useMemo(
		() => [
			{
				value: 'delivery' as HandoverMode,
				label: 'Deliver to me',
				hint: car.delivery ? 'Hotel, villa or airport' : 'Not offered for this car',
				disabled: !car.delivery,
			},
			{
				value: 'garage' as HandoverMode,
				label: 'Collect at the garage',
				hint: car.garage ? siteConfig.contact.addressShort : 'Not offered for this car',
				disabled: !car.garage,
			},
		],
		[car.delivery, car.garage],
	);

	const returnLabel = h.mode === 'delivery' ? 'Collect it from the same address' : 'Return it to the garage';

	return (
		<div className="space-y-10">
			<div>
				<p className={SUB_HEAD}>Dates</p>
				<RangeCalendar
					ranges={ranges}
					timezone={h.tz}
					value={{ from: h.from, until: h.until }}
					onChange={h.setRange}
					maxDays={car.maxDays}
					loading={rangesLoading && ranges.length === 0}
				/>
				{slotTaken || (h.from && h.until && !datesFit && !rangesLoading) ? (
					<p role="alert" className="mt-4 border-l-2 border-[#E5787A] pl-3 text-sm text-[#E5787A]">
						These dates were just taken for the {car.title}. Pick other dates or another car.
					</p>
				) : null}
			</div>

			<div className="grid gap-10 lg:grid-cols-2">
				<div>
					<p className={SUB_HEAD}>Handover window{h.from ? ` · ${shortDate(h.from)}` : ''}</p>
					<ChoiceChips layoutId="book-handover-time" label="Handover window" options={TIME_OPTIONS} value={h.handoverTime} onChange={h.setHandoverTime} tabular />
				</div>
				<div>
					<p className={SUB_HEAD}>Return window{h.until ? ` · ${shortDate(h.until)}` : ''}</p>
					<ChoiceChips layoutId="book-return-time" label="Return window" options={TIME_OPTIONS} value={h.returnTime} onChange={h.setReturnTime} tabular />
				</div>
			</div>

			<div>
				<p className={SUB_HEAD}>Handover</p>
				<ChoiceChips layoutId="book-mode" label="Handover" options={modeOptions} value={h.mode} onChange={h.setMode} columns={2} />
				<Unfold show={h.mode === 'delivery'}>
					<DeliveryFields handover={h} />
				</Unfold>
				<Unfold show={h.mode === 'garage'}>
					<div className="mt-6 border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-5 text-sm">
						<p className="whitespace-pre-line text-[var(--color-ink)]">{siteConfig.contact.address}</p>
						<p className="mt-2 text-[var(--color-ink-muted)]">{siteConfig.contact.hours[0]?.value}</p>
						<a href={siteConfig.contact.mapHref} target="_blank" rel="noreferrer" className="link-underline mt-4 inline-block text-xs uppercase tracking-[0.2em] text-[var(--color-primary)]">
							Open in Maps
						</a>
					</div>
				</Unfold>
			</div>

			<div>
				<p className={SUB_HEAD}>Return</p>
				<ChoiceChips
					layoutId="book-return-place"
					label="Return"
					columns={2}
					options={[
						{ value: 'same', label: returnLabel },
						{ value: 'elsewhere', label: 'Somewhere else', hint: 'Another hotel, villa or the airport' },
					]}
					value={h.returnElsewhere ? 'elsewhere' : 'same'}
					onChange={(v) => h.setReturnElsewhere(v === 'elsewhere')}
				/>
				<Unfold show={h.returnElsewhere}>
					<LabeledField label="Collection address" className="mt-6">
						{(id) => (
							<Textarea
								id={id}
								rows={2}
								value={h.collectAddress}
								onChange={(e) => h.setCollectAddress(e.target.value)}
								placeholder="Hotel or building, area"
								autoComplete="off"
							/>
						)}
					</LabeledField>
				</Unfold>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-line)] pt-8">
				<p className="text-sm text-[var(--color-ink-muted)]">
					{h.days > 0 ? (
						<>
							<span className="tabular text-[var(--color-ink)]">{h.days}</span> {h.days === 1 ? 'day' : 'days'} with the {car.title}
						</>
					) : (
						'Pick a pick-up and a return date.'
					)}
				</p>
				<Button variant="primary" size="md" onClick={onContinue} disabled={!canContinue}>
					Continue to extras
				</Button>
			</div>
		</div>
	);
}

function DeliveryFields({ handover: h }: { handover: RentalHandover }) {
	return (
		<div className="mt-6 grid gap-5 sm:grid-cols-2">
			<LabeledField label="Hotel, villa or building" className="sm:col-span-2">
				{(id) => (
					<Input id={id} value={h.address.line1} onChange={(e) => h.updateAddress({ line1: e.target.value })} autoComplete="address-line1" placeholder="e.g. Atlantis The Royal" />
				)}
			</LabeledField>
			<LabeledField label="Room, apartment or villa no. (optional)">
				{(id) => <Input id={id} value={h.address.line2} onChange={(e) => h.updateAddress({ line2: e.target.value })} autoComplete="address-line2" />}
			</LabeledField>
			<LabeledField label="Area (optional)">
				{(id) => <Input id={id} value={h.address.area} onChange={(e) => h.updateAddress({ area: e.target.value })} placeholder="e.g. Palm Jumeirah" />}
			</LabeledField>
			<LabeledField label="City">
				{(id) => <Input id={id} value={h.address.city} onChange={(e) => h.updateAddress({ city: e.target.value })} autoComplete="address-level2" />}
			</LabeledField>
			<LabeledField label="Flight number (airport only)">
				{(id) => (
					<Input id={id} value={h.flightNumber} onChange={(e) => h.setFlightNumber(e.target.value)} placeholder="e.g. EK 002" className="uppercase" autoComplete="off" />
				)}
			</LabeledField>
		</div>
	);
}

function LabeledField({ label, className, children }: { label: string; className?: string; children: (id: string) => ReactNode }) {
	const id = useId();
	return (
		<div className={className}>
			<label htmlFor={id} className={FIELD_LABEL}>
				{label}
			</label>
			{children(id)}
		</div>
	);
}

function Unfold({ show, children }: { show: boolean; children: ReactNode }) {
	const reduce = useReducedMotion();
	return (
		<AnimatePresence initial={false}>
			{show ? (
				<motion.div
					initial={reduce ? false : UNFOLD_INITIAL}
					animate={UNFOLD_ANIMATE}
					exit={reduce ? undefined : UNFOLD_INITIAL}
					transition={reduce ? NO_TRANSITION : UNFOLD_TRANSITION}
					className="overflow-hidden"
				>
					<div className="px-px pb-1">{children}</div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}

const SHORT_DATE = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "Tue 10 Nov" for a local YYYY-MM-DD (formatted as UTC so it never shifts). */
export function shortDate(date: string): string {
	return SHORT_DATE.format(new Date(`${date}T00:00:00Z`));
}
