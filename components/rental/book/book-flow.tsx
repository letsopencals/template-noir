'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { fitsDates, toAppointmentSlot } from '@/lib/rental';
import { useCarRanges } from '@/hooks/use-car-ranges';
import { useRentalBooking } from '@/hooks/use-rental-booking';
import { useRentalHandover, type HandoverMode } from '@/hooks/use-rental-handover';
import { useSmoothScroll } from '@/components/motion/smooth-scroll';
import { AddOnsSelector } from '@/components/booking/addons-selector';
import { DetailsStep } from '@/components/booking/details-step';
import { QuestionsForm } from '@/components/booking/questions-form';
import { Button } from '@/components/ui/button';
import type { BookCar } from './book-car';
import { BookSection, type SectionState } from './book-section';
import { CarSwitcher } from './car-switcher';
import { EstimateBar } from './estimate-bar';
import { SummaryRail, type BookTotals } from './summary-rail';
import { WhenWhere, shortDate } from './when-where';
import { formatMoney } from './money';

// Stripe is heavy and only needed in the last step.
const PaymentStep = dynamic(() => import('@/components/booking/payment-step').then((m) => m.PaymentStep), { ssr: false });

interface BookFlowProps {
	cars: BookCar[];
	initial: { carSlug: string; from: string | null; until: string | null; mode: HandoverMode };
}

const SECTION_IDS = ['book-when', 'book-extras', 'book-you', 'book-pay'] as const;
type Step = 0 | 1 | 2 | 3;

function availableMode(car: BookCar, mode: HandoverMode): HandoverMode {
	if (mode === 'delivery' && !car.delivery && car.garage) return 'garage';
	if (mode === 'garage' && !car.garage && car.delivery) return 'delivery';
	return mode;
}

/**
 * The single-page rental booking: car → when & where → extras → you → payment.
 * Steps unlock in order (`reached`); each Continue unfolds the next and scrolls to it.
 */
export function BookFlow({ cars, initial }: BookFlowProps) {
	const h = useRentalHandover(initial);
	const car = cars.find((c) => c.slug === h.carSlug) ?? cars[0]!;
	const lenis = useSmoothScroll();
	const [reached, setReached] = useState<Step>(0);
	const sectionRefs = useRef<Array<HTMLElement | null>>([]);

	// Keep the handover mode valid for the chosen car.
	const { setMode } = h;
	useEffect(() => {
		const next = availableMode(car, h.mode);
		if (next !== h.mode) setMode(next);
	}, [car, h.mode, setMode]);

	const locationId = (h.mode === 'delivery' ? car.delivery?.id : car.garage?.id) ?? car.garage?.id ?? car.delivery?.id ?? null;
	// One product pool per car: ranges are location-agnostic (each lists every locationId), so
	// don't filter by the chosen mode. Deliver / garage only sets locationId on the slot.
	const { ranges, isLoading: rangesLoading, refresh } = useCarRanges(car.slug);
	const datesFit = h.from && h.until ? fitsDates(ranges, h.from, h.until, h.tz) : false;
	const slot = useMemo(() => (h.from && h.until ? toAppointmentSlot(h.from, h.until, h.tz) : null), [h.from, h.until, h.tz]);
	const bookingCar = useMemo(() => ({ id: car.id, slug: car.slug, variant: car.variant }), [car.id, car.slug, car.variant]);
	const onSlotUnavailable = useCallback(() => {
		void refresh();
		setReached(0);
	}, [refresh]);

	const b = useRentalBooking({
		car: bookingCar,
		slot,
		units: h.days,
		locationId,
		customAttributes: h.customAttributes,
		address: h.appointmentAddress,
		onSlotUnavailable,
	});

	const whenComplete = h.days > 0 && datesFit && !b.slotTaken && h.timesValid && h.addressValid && h.collectValid;
	const unlocked = (s: Step) => s === 0 || (whenComplete && reached >= s && (s < 3 || b.reservation !== null));
	const stateOf = (s: Step, complete: boolean): SectionState => (!unlocked(s) ? 'locked' : complete && reached > s ? 'done' : 'open');

	const scrollTo = useCallback(
		(s: Step) => {
			// Let the next section start unfolding before measuring.
			window.setTimeout(() => {
				const el = sectionRefs.current[s];
				if (!el) return;
				if (lenis) lenis.scrollTo(el, { offset: -96, duration: 1.1 });
				else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 120);
		},
		[lenis],
	);

	const goTo = useCallback(
		(s: Step) => {
			setReached((r) => (r < s ? s : r));
			scrollTo(s);
		},
		[scrollTo],
	);

	const onReserve = useCallback(async () => {
		if (await b.reserve()) goTo(3);
	}, [b, goTo]);

	const totals = useMemo<BookTotals>(() => {
		const days = h.days;
		const extrasLines = Array.from(b.selectedAddOns.entries()).flatMap(([id, qty]) => {
			const a = b.availableAddOns.find((x) => x.id === id);
			if (!a) return [];
			const amount = (a.durationMultiplied ? a.price * days : a.price) * qty;
			const label = `${a.title}${qty > 1 ? ` × ${qty}` : ''}${a.durationMultiplied ? ` · ${days} ${days === 1 ? 'day' : 'days'}` : ''}`;
			return [{ id, label, amount }];
		});
		const base = car.pricePerDay * days;
		const extras = extrasLines.reduce((s, l) => s + l.amount, 0);
		const fromCart = b.held && b.reservation !== null;
		return { days, base, extras, extrasLines, total: fromCart ? b.reservation!.cart.total : base + extras, fromCart };
	}, [h.days, b.selectedAddOns, b.availableAddOns, b.held, b.reservation, car.pricePerDay]);

	const reserveLabel = b.reserving ? 'Holding the car…' : b.stale ? 'Update reservation' : b.held ? 'Continue to payment' : 'Reserve & continue';
	const onYouSubmit = b.held ? () => goTo(3) : onReserve;

	const cta = !whenComplete
		? { label: 'Continue', disabled: false, run: () => scrollTo(0) }
		: reached < 1
			? { label: 'Extras', disabled: false, run: () => goTo(1) }
			: reached < 2
				? { label: 'Your details', disabled: false, run: () => goTo(2) }
				: !b.held
					? { label: b.stale ? 'Update' : 'Reserve', disabled: !b.canReserve, run: onReserve }
					: { label: 'Pay', disabled: false, run: () => goTo(3) };

	const setRef = (s: Step) => (el: HTMLElement | null) => {
		sectionRefs.current[s] = el;
	};

	return (
		<div className="pb-32 lg:pb-24">
			<CarSwitcher cars={cars} active={car} onSelect={h.setCarSlug} />

			<div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-20">
				<div className="min-w-0">
					<BookSection
						ref={setRef(0)}
						id={SECTION_IDS[0]}
						index="01"
						title="When & where"
						state={stateOf(0, whenComplete)}
						summary={h.from && h.until ? `${shortDate(h.from)} → ${shortDate(h.until)} · ${h.mode === 'delivery' ? 'Delivered' : 'Garage'}` : null}
					>
						<WhenWhere
							car={car}
							handover={h}
							ranges={ranges}
							rangesLoading={rangesLoading}
							datesFit={datesFit}
							slotTaken={b.slotTaken}
							canContinue={whenComplete}
							onContinue={() => goTo(1)}
						/>
					</BookSection>

					<BookSection
						ref={setRef(1)}
						id={SECTION_IDS[1]}
						index="02"
						title="Extras"
						state={stateOf(1, true)}
						lockedHint="Pick your dates and handover first."
						summary={totals.extrasLines.length ? `${totals.extrasLines.length} added · ${formatMoney(totals.extras, car.currency)}` : 'None added'}
					>
						<AddOnsSelector
							addOns={b.availableAddOns}
							loading={b.addOnsLoading}
							selected={b.selectedAddOns}
							bookedDurationUnits={Math.max(h.days, 1)}
							currency={car.currency}
							onChange={b.updateAddOnQuantity}
							unitLabel="day"
							bare
						/>
						<div className="mt-8 flex justify-end">
							<Button variant="primary" size="md" onClick={() => goTo(2)}>
								Continue to your details
							</Button>
						</div>
					</BookSection>

					<BookSection
						ref={setRef(2)}
						id={SECTION_IDS[2]}
						index="03"
						title="You"
						state={stateOf(2, b.held)}
						lockedHint="Driver details and documents."
						summary={b.held ? `${b.firstName} ${b.lastName} · car held` : null}
					>
						<DetailsStep
							email={b.email}
							firstName={b.firstName}
							lastName={b.lastName}
							customerId={b.customerId}
							onChangeEmail={b.setEmail}
							onChangeFirstName={b.setFirstName}
							onChangeLastName={b.setLastName}
							phone={b.phone}
							onChangePhone={b.setPhone}
							phoneRequired
							fieldErrors={b.fieldErrors}
							submitting={b.reserving}
							canSubmit={b.canReserve}
							onSubmit={onReserve}
							hideSubmit
							bare
						>
							{b.questions.length ? (
								<div className="mt-10">
									<QuestionsForm
										questions={b.questions}
										answers={b.answers}
										setAnswers={b.setAnswers}
										uploads={b.uploads}
										title="Licence & documents"
										bare
									/>
								</div>
							) : null}
						</DetailsStep>
						{b.error && !b.held ? (
							<p role="alert" className="mt-6 text-sm text-[#E5787A]">
								{b.error}
							</p>
						) : null}
						<div className="mt-8 flex flex-wrap items-center justify-between gap-4">
							<p className="max-w-sm text-xs text-[var(--color-ink-dim)]">
								We hold the car while you pay. Nothing is charged until the next step.
							</p>
							<Button variant="primary" size="md" onClick={onYouSubmit} disabled={b.held ? false : !b.canReserve}>
								{reserveLabel}
							</Button>
						</div>
					</BookSection>

					<BookSection ref={setRef(3)} id={SECTION_IDS[3]} index="04" title="Payment" state={stateOf(3, false)} lockedHint="Reserve the car to pay.">
						{b.held ? (
							<>
								<PaymentStep
									providers={b.providers}
									provider={b.provider}
									paymentData={b.paymentData}
									submitting={b.submitting}
									isExpired={b.isExpired}
									onSelectProvider={b.selectProvider}
									onStripeSuccess={(pi) => void b.submitCheckout(pi)}
									onStripeError={b.setError}
									onSubmitCash={() => void b.submitCheckout()}
									bare
								/>
								{b.error ? (
									<p role="alert" className="mt-6 text-sm text-[#E5787A]">
										{b.error}
									</p>
								) : null}
							</>
						) : (
							<StaleNotice expired={b.isExpired} reserving={b.reserving} canReserve={b.canReserve} onReserve={onReserve} />
						)}
					</BookSection>
				</div>

				<div className="hidden lg:block">
					<SummaryRail
						car={car}
						from={h.from}
						until={h.until}
						mode={h.mode}
						handoverTime={h.handoverTime}
						returnTime={h.returnTime}
						totals={totals}
						held={b.held}
						timeRemaining={b.timeRemaining}
					/>
				</div>
			</div>

			<EstimateBar
				totals={totals}
				currency={car.currency}
				depositAed={car.depositAed}
				timeRemaining={b.held ? b.timeRemaining : null}
				ctaLabel={cta.label}
				ctaDisabled={cta.disabled}
				onCta={cta.run}
			/>
		</div>
	);
}

function StaleNotice({ expired, reserving, canReserve, onReserve }: { expired: boolean; reserving: boolean; canReserve: boolean; onReserve: () => void }) {
	return (
		<div className="border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-6 sm:px-7">
			<p className="text-sm text-[var(--color-ink-muted)]">
				{expired ? 'The hold on this car ran out.' : 'You changed your booking after we held the car.'} Update the reservation to see the final
				price and pay.
			</p>
			<Button variant="primary" size="md" className="mt-5" onClick={onReserve} disabled={reserving || !canReserve}>
				{reserving ? 'Holding the car…' : 'Update reservation'}
			</Button>
		</div>
	);
}
