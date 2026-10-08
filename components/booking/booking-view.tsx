'use client';

import { useId } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import type { ProductListItemResponse } from '@opencals/storefront-sdk';
import { formatPrice } from '@/lib/format';
import { siteConfig } from '@/lib/site-config';
import { BOOKING_STEPS, type BookingStep } from '@/lib/booking-constants';
import { HorizontalDayStrip } from '@/components/booking/horizontal-day-strip';
import { TimeSlots } from '@/components/booking/time-slots';
import { StaffSelector } from '@/components/booking/staff-selector';
import { LocationSelector } from '@/components/booking/location-selector';
import { AddOnsSelector } from '@/components/booking/addons-selector';
import { BookingSummary } from '@/components/booking/booking-summary';
import { DetailsStep } from '@/components/booking/details-step';
import { StepProgress } from '@/components/booking/step-indicator';
import { QuestionsForm } from '@/components/booking/questions-form';
import { BookingBar } from '@/components/booking/chauffeur/booking-bar';
import { DurationStepper } from '@/components/booking/chauffeur/duration-stepper';
import { PreferredCarPicker, type PreferredCarOption } from '@/components/booking/chauffeur/preferred-car-picker';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { useBookingFlow } from '@/hooks/use-booking-flow';
import { useSettings } from '@/contexts/settings-context';

// Stripe is heavy and only needed on the final step, so load it on demand.
const PaymentStep = dynamic(() => import('@/components/booking/payment-step').then((m) => m.PaymentStep), { ssr: false });

const STEP_INITIAL = { opacity: 0, y: 12 };
const STEP_ANIMATE = { opacity: 1, y: 0 };
const STEP_EXIT = { opacity: 0, y: -8 };
const STEP_TRANSITION = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };
const FADE_ONLY = { opacity: 0 };
const NO_CARS: PreferredCarOption[] = [];

const LABEL = 'mb-3 text-[0.68rem] uppercase tracking-[0.24em] text-[var(--color-ink-muted)]';

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
	return (
		<div role="alert" className="mb-6 flex items-start justify-between gap-3 border border-[#E5787A]/40 bg-[#E5787A]/[0.06] px-4 py-3 text-sm text-[#E5787A]">
			<span>{message}</span>
			<button type="button" onClick={onDismiss} className="shrink-0 text-[0.62rem] uppercase tracking-[0.22em] underline underline-offset-4">
				Dismiss
			</button>
		</div>
	);
}

function PickupField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
	const id = useId();
	return (
		<div>
			<label htmlFor={id} className="mb-2 block text-[0.66rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)]">
				Pick-up address
			</label>
			<Textarea
				id={id}
				rows={2}
				autoComplete="street-address"
				placeholder="Hotel, villa or terminal. For arrivals, add your flight number."
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="min-h-screen bg-[var(--color-bg)] pt-32 pb-20">
			<div className="mx-auto max-w-[1100px] animate-pulse space-y-4 px-6 lg:px-10">
				<div className="h-10 bg-[var(--color-surface)]" />
				<div className="h-28 bg-[var(--color-surface)]" />
				<div className="h-64 bg-[var(--color-surface)]" />
			</div>
		</div>
	);
}

export function BookingView({
	slug,
	initialProduct,
	cars = NO_CARS,
}: {
	slug: string;
	initialProduct: ProductListItemResponse | null;
	/** Fleet cars for the optional preferred-car request. */
	cars?: PreferredCarOption[];
}) {
	const { currency } = useSettings();
	const flow = useBookingFlow(slug, initialProduct);
	const reduce = useReducedMotion();
	const initial = reduce ? FADE_ONLY : STEP_INITIAL;
	const exit = reduce ? FADE_ONLY : STEP_EXIT;

	if (flow.loading) return <LoadingState />;

	if (flow.error && !flow.product) {
		return (
			<div className="min-h-screen bg-[var(--color-bg)] pt-32 pb-20">
				<div className="mx-auto max-w-[1100px] px-6 text-center lg:px-10">
					<p className="text-[var(--color-ink-muted)]">{flow.error}</p>
					<Link href="/chauffeur" className="link-underline mt-6 inline-block text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-primary)]">
						← Back to chauffeur
					</Link>
				</div>
			</div>
		);
	}

	if (!flow.product) return null;

	const variantLocations = flow.activeVariant?.locations ?? [];
	const variantLabel = flow.hasVariants ? (flow.activeVariant?.variantTitle ?? null) : null;
	const unitPrice = flow.activeVariant?.price ?? flow.product.price;
	const units = flow.duration.enabled ? flow.bookedDurationUnits : 1;
	const totalPrice = unitPrice * units * flow.attendees + flow.addOnsTotal;
	const displayPrice = formatPrice(totalPrice, currency);
	const preferredKey = siteConfig.customAttributeKeys.preferredCar;
	const preferredSlug = flow.customAttributes[preferredKey] ?? null;
	const preferredTitle = preferredSlug ? (cars.find((c) => c.slug === preferredSlug)?.title ?? preferredSlug) : null;

	const visibleSteps: BookingStep[] = BOOKING_STEPS.filter((s) => {
		if (s === 'who' && flow.whoSkipped) return false;
		if (s === 'extras' && flow.extrasSkipped) return false;
		if (s === 'questions' && flow.questionsSkipped) return false;
		return true;
	});

	const showSummary = flow.step !== 'when' && flow.step !== 'who';
	const finalStaff = flow.staffForLocation.find((s) => s.id === flow.finalStaffId) ?? null;

	return (
		<div className="min-h-screen bg-[var(--color-bg)] pt-[72px]">
			<BookingBar title={flow.product.title ?? 'Chauffeur'} total={totalPrice} currency={currency} />

			<div className="mx-auto max-w-[1200px] px-6 pt-10 pb-24 lg:px-10">
				<p className="eyebrow">Chauffeur</p>
				<h1 className="heading-display mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl">{flow.product.title}</h1>

				<div className="mt-8 border-y border-[var(--color-line)] py-2">
					<StepProgress steps={visibleSteps} current={flow.step} completed={flow.stepCompleted} canEnter={flow.canEnter} onSelect={flow.goToStep} />
				</div>

				<div className={clsx('mt-10 grid gap-10', showSummary ? 'lg:grid-cols-[1fr_360px]' : '')}>
					<div className={clsx('min-w-0', showSummary ? 'order-2 lg:order-1' : '')}>
						{variantLocations.length > 1 ? (
							<div className="mb-8">
								<p className={LABEL}>Where we collect you</p>
								<LocationSelector locations={variantLocations} selected={flow.selectedLocationId} onSelect={flow.setSelectedLocationId} />
							</div>
						) : null}

						{flow.hasVariants && flow.variants.length > 1 ? (
							<div className="mb-8">
								<p className={LABEL}>Option</p>
								<div data-lenis-prevent className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
									{flow.variants.map((v) => {
										const isActive = (flow.activeVariant?.id ?? flow.variants[0]?.id) === v.id;
										return (
											<button
												key={v.id}
												type="button"
												aria-pressed={isActive}
												onClick={() => flow.setSelectedVariantId(v.id)}
												className={clsx(
													'shrink-0 border px-5 py-2.5 text-sm transition-colors duration-300',
													isActive
														? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-black'
														: 'border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary-dark)]',
												)}
											>
												{v.variantTitle} · <span className="tabular">{formatPrice(v.price, currency)}</span>
											</button>
										);
									})}
								</div>
							</div>
						) : null}

						{flow.error ? <ErrorBanner message={flow.error} onDismiss={() => flow.setError(null)} /> : null}

						<AnimatePresence mode="wait">
							{flow.step === 'when' ? (
								<motion.div key="when" initial={initial} animate={STEP_ANIMATE} exit={exit} transition={STEP_TRANSITION} className="space-y-8">
									{flow.duration.enabled ? (
										<DurationStepper
											units={flow.duration.units}
											maxUnits={flow.duration.maxUnits}
											baseSeconds={flow.duration.baseSeconds}
											unitPrice={unitPrice}
											currency={currency}
											onChange={flow.setDurationUnits}
										/>
									) : null}

									{flow.staffForLocation.length > 1 ? (
										<StaffSelector staffMembers={flow.staffForLocation} selected={flow.selectedStaffId} onSelect={flow.setSelectedStaffId} />
									) : null}

									<HorizontalDayStrip selectedDate={flow.selectedDate} onDateSelect={flow.setSelectedDate} timezone={flow.timezone} />

									<div>
										{flow.selectedDate ? (
											<TimeSlots
												slots={flow.slots}
												selectedSlot={flow.selectedSlot}
												onSlotSelect={flow.handleSlotSelect}
												loading={flow.slotsLoading}
												timezone={flow.timezone}
												staffMembers={flow.staffForLocation}
											/>
										) : (
											<p className="border border-dashed border-[var(--color-line-strong)] py-10 text-center text-sm text-[var(--color-ink-muted)]">
												Pick a day to see pick-up times.
											</p>
										)}
										<p className="mt-4 text-xs text-[var(--color-ink-dim)]">All times are Dubai time.</p>
									</div>
								</motion.div>
							) : null}

							{flow.step === 'who' && flow.selectedSlot ? (
								<motion.div key="who" initial={initial} animate={STEP_ANIMATE} exit={exit} transition={STEP_TRANSITION}>
									<p className="mb-5 text-sm text-[var(--color-ink-muted)]">More than one chauffeur is free at that time. Choose yours.</p>
									<StaffSelector staffMembers={flow.slotStaff} selected={flow.confirmedStaffId} onSelect={flow.setConfirmedStaffId} hideLabel />
								</motion.div>
							) : null}

							{flow.step === 'extras' && flow.selectedSlot ? (
								<motion.div key="extras" initial={initial} animate={STEP_ANIMATE} exit={exit} transition={STEP_TRANSITION} className="space-y-6">
									<AddOnsSelector
										addOns={flow.availableAddOns}
										loading={flow.addOnsLoading}
										selected={flow.selectedAddOns}
										bookedDurationUnits={flow.bookedDurationUnits}
										currency={currency}
										onChange={flow.updateAddOnQuantity}
									/>
									<Button variant="primary" size="lg" fullWidth onClick={flow.handleContinueFromExtras}>
										{flow.selectedAddOns.size > 0 ? 'Continue' : 'Skip extras'}
									</Button>
								</motion.div>
							) : null}

							{flow.step === 'questions' ? (
								<motion.div key="questions" initial={initial} animate={STEP_ANIMATE} exit={exit} transition={STEP_TRANSITION}>
									<QuestionsForm
										questions={flow.questions}
										answers={flow.answers}
										setAnswers={flow.setAnswers}
										uploads={flow.uploads}
										valid={flow.questionsValid}
										onContinue={flow.handleContinueFromQuestions}
									/>
								</motion.div>
							) : null}

							{flow.step === 'details' ? (
								<motion.div key="details" initial={initial} animate={STEP_ANIMATE} exit={exit} transition={STEP_TRANSITION}>
									<DetailsStep
										email={flow.email}
										firstName={flow.firstName}
										lastName={flow.lastName}
										customerId={flow.customerId}
										onChangeEmail={flow.setEmail}
										onChangeFirstName={flow.setFirstName}
										onChangeLastName={flow.setLastName}
										phone={flow.phone}
										onChangePhone={flow.setPhone}
										phoneRequired
										fieldErrors={flow.fieldErrors}
										submitting={flow.submitting}
										canSubmit={flow.detailsValid}
										onSubmit={flow.handleSubmitDetails}
										submitLabel={flow.committed ? 'Continue to payment' : 'Hold & continue'}
									>
										<div className="space-y-8">
											{flow.needsPickupAddress ? <PickupField value={flow.pickupAddress} onChange={flow.setPickupAddress} /> : null}
											<PreferredCarPicker cars={cars} value={preferredSlug} onChange={(s) => flow.setCustomAttribute(preferredKey, s)} />
										</div>
									</DetailsStep>
								</motion.div>
							) : null}

							{flow.step === 'payment' ? (
								<motion.div key="payment" initial={initial} animate={STEP_ANIMATE} exit={exit} transition={STEP_TRANSITION}>
									<PaymentStep
										providers={flow.providers}
										provider={flow.provider}
										paymentData={flow.paymentData}
										submitting={flow.submitting}
										isExpired={flow.isExpired}
										onSelectProvider={flow.handleSelectProvider}
										onStripeSuccess={(piId) => flow.handleSubmitCheckout(piId)}
										onStripeError={(msg) => flow.setError(msg)}
										onSubmitCash={() => flow.handleSubmitCheckout()}
										cashTitle="Pay your chauffeur"
										cashBody="Nothing is charged now. You settle the journey on the day."
									/>
								</motion.div>
							) : null}
						</AnimatePresence>
					</div>

					{showSummary ? (
						<aside className="order-1 lg:order-2">
							<div className="space-y-3 lg:sticky lg:top-[136px]">
								{flow.selectedSlot ? (
									<BookingSummary
										product={flow.product}
										activeVariant={flow.activeVariant}
										variantLabel={variantLabel}
										staff={finalStaff}
										location={flow.selectedLocation}
										selectedSlot={flow.selectedSlot}
										selectedDate={flow.selectedDate}
										availableAddOns={flow.availableAddOns}
										selectedAddOns={flow.selectedAddOns}
										bookedDurationUnits={flow.bookedDurationUnits}
										currency={currency}
										attendees={flow.attendees}
										whoSkipped={flow.whoSkipped}
										formatCustom={flow.formatCustom}
										formatTimeRange={flow.formatTimeRange}
										onEdit={flow.goToStep}
										bookedSeconds={flow.duration.durationSeconds}
										preferredCar={preferredTitle}
									/>
								) : null}
								<div className="flex items-baseline justify-between border border-[var(--color-primary-dark)] bg-[var(--color-tint)] px-5 py-4">
									<span className="text-[0.62rem] uppercase tracking-[0.24em] text-[var(--color-ink-muted)]">Total</span>
									<span className="tabular text-2xl text-[var(--color-primary)]">{displayPrice}</span>
								</div>
							</div>
						</aside>
					) : null}
				</div>
			</div>
		</div>
	);
}
