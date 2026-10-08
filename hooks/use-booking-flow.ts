'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import type {
	AppointmentAddress,
	CheckoutStartResponse,
	CurrentAvailabilitySlot,
	ProductListItemResponse,
} from '@opencals/storefront-sdk';
import type { BookingStep } from '@/lib/booking-constants';
import { siteConfig } from '@/lib/site-config';
import { useCart } from '@/contexts/cart-context';
import { useLocation } from '@/contexts/location-context';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useProductData } from '@/hooks/use-product-data';
import { useAvailability } from '@/hooks/use-availability';
import { useBookingAddOns } from '@/hooks/use-booking-add-ons';
import { buildAnswerPayload, questionsComplete, useCheckoutQuestions } from '@/hooks/use-checkout-questions';
import { usePaymentProviders } from '@/hooks/use-payment-providers';
import { useCustomDuration } from '@/hooks/use-custom-duration';
import { useFileUploads } from '@/hooks/use-file-upload';

type FieldErrors = Record<string, string[]>;

/**
 * The classic multi-step flow (chauffeur packages): when → chauffeur → extras →
 * questions → details → payment.
 *
 * Beyond the stock flow it supports a custom length for `allowCustomDuration`
 * products, appointment custom attributes (e.g. `preferred_car`), a pick-up
 * address for delivery locations, file-upload answers and a phone number. A
 * hold is replaced (`replaceItemId`) when the guest changes anything after
 * "Continue to payment", so stale holds never block the new time.
 */
export function useBookingFlow(slug: string, initialProduct: ProductListItemResponse | null = null) {
	const router = useRouter();
	const { data: session } = useSession();
	const { cartId, setCart, clearCart, timeRemaining } = useCart();
	const { selectedLocationId: globalLocationId } = useLocation();
	const { formatCustom, formatTimeRange, timezone } = useDateFormatter();

	const productData = useProductData(slug, initialProduct);
	const { product, activeVariant, variants, hasVariants, selectedVariantId, setSelectedVariantId } = productData;

	// Selection
	const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
	const [confirmedStaffId, setConfirmedStaffId] = useState<string | null>(null);
	const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
	const [attendees, setAttendees] = useState(1);
	const duration = useCustomDuration(activeVariant);

	// Customer
	const [customerId, setCustomerId] = useState<string | null>(null);
	const [email, setEmail] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [phone, setPhone] = useState('');
	const prefilledRef = useRef(false);

	// Extras on the appointment
	const [customAttributes, setCustomAttributes] = useState<Record<string, string>>({});
	const [pickupAddress, setPickupAddress] = useState('');

	// Questions
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const uploads = useFileUploads();

	// Payment
	const [provider, setProvider] = useState<string | null>(null);
	const [paymentData, setPaymentData] = useState<CheckoutStartResponse | null>(null);

	// Flow
	const [step, setStep] = useState<BookingStep>('when');
	const [committedSignature, setCommittedSignature] = useState<string | null>(null);
	const [committedCartId, setCommittedCartId] = useState<string | null>(null);
	const [committedItemId, setCommittedItemId] = useState<string | null>(null);
	const [linkedFiles, setLinkedFiles] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	const finalStaffId = selectedStaffId ?? confirmedStaffId;
	const isExpired = timeRemaining !== null && timeRemaining <= 0;

	useEffect(() => {
		if (session?.customer && !prefilledRef.current) {
			if (session.customer.id) setCustomerId(session.customer.id);
			if (session.customer.email) setEmail(session.customer.email);
			if (session.customer.firstName) setFirstName(session.customer.firstName);
			if (session.customer.lastName) setLastName(session.customer.lastName);
			prefilledRef.current = true;
		}
	}, [session]);

	// Payment providers (cart-aware) and checkout questions load in parallel via SWR.
	const providers = usePaymentProviders(committedCartId ?? cartId);
	const questions = useCheckoutQuestions(slug || null);

	const staffForLocation = useMemo(() => {
		return (activeVariant?.staffMembers ?? []).filter((staff) => {
			if (!selectedLocationId) return true;
			const staffLocations = staff.locations;
			if (!staffLocations) return true;
			return staffLocations.some((l) => l.id === selectedLocationId);
		});
	}, [activeVariant?.staffMembers, selectedLocationId]);

	const availability = useAvailability({
		activeVariant,
		timezone,
		staffMemberId: selectedStaffId,
		locationId: selectedLocationId,
		duration: duration.durationSeconds,
	});

	const slotStaff = useMemo(() => {
		if (!availability.selectedSlot) return [] as typeof staffForLocation;
		return staffForLocation.filter((s) => availability.selectedSlot!.staffMemberIds?.includes(s.id));
	}, [availability.selectedSlot, staffForLocation]);

	const whoSkipped = selectedStaffId !== null || slotStaff.length <= 1;

	const bookedDurationUnits = useMemo(() => {
		const baseDuration = activeVariant?.duration ?? product?.duration;
		if (!baseDuration || !availability.selectedSlot) return duration.units;
		const slot = availability.selectedSlot;
		const from = new Date(`${slot.fromDate}T${slot.fromTime}Z`);
		const to = new Date(`${slot.toDate}T${slot.toTime}Z`);
		const durationSeconds = (to.getTime() - from.getTime()) / 1000;
		return Math.max(1, Math.ceil(durationSeconds / baseDuration));
	}, [activeVariant?.duration, product?.duration, availability.selectedSlot, duration.units]);

	const addOns = useBookingAddOns({
		activeVariant,
		locationId: selectedLocationId,
		staffMemberId: finalStaffId,
		bookedDurationUnits,
	});

	const selectedLocation = useMemo(
		() => (activeVariant?.locations ?? []).find((l) => l.id === selectedLocationId) ?? null,
		[activeVariant?.locations, selectedLocationId],
	);
	const needsPickupAddress = selectedLocation?.type === siteConfig.locationTypes.delivery;

	const address = useMemo<AppointmentAddress | null>(
		() =>
			needsPickupAddress && pickupAddress.trim()
				? { addressLine1: pickupAddress.trim(), city: 'Dubai', country: siteConfig.country }
				: null,
		[needsPickupAddress, pickupAddress],
	);

	const attributes = useMemo(() => {
		const out: Record<string, string> = {};
		for (const [k, v] of Object.entries(customAttributes)) if (v.trim()) out[k] = v.trim();
		return out;
	}, [customAttributes]);

	const setCustomAttribute = useCallback((key: string, value: string | null) => {
		setCustomAttributes((prev) => {
			const next = { ...prev };
			if (value) next[key] = value;
			else delete next[key];
			return next;
		});
	}, []);

	const cartHeaders = useCallback(
		(id?: string | null): Record<string, string> => {
			const h: Record<string, string> = { 'Content-Type': 'application/json' };
			const useId = id ?? committedCartId ?? cartId;
			if (useId) h['X-Cart-Id'] = useId;
			return h;
		},
		[cartId, committedCartId],
	);

	// Reset on variant switch. The earlier hold (if any) stays tracked so the next
	// "Continue to payment" replaces it.
	useEffect(() => {
		setSelectedStaffId(null);
		setConfirmedStaffId(null);
		availability.setSelectedDate(null);
		setCommittedSignature(null);
		setProvider(null);
		setPaymentData(null);
		setStep('when');
		addOns.resetSelection();
		setAnswers({});
		uploads.reset();

		const variantLocations = activeVariant?.locations ?? [];
		const contextMatch = variantLocations.find((l) => l.id === globalLocationId);
		setSelectedLocationId(contextMatch?.id ?? variantLocations[0]?.id ?? null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedVariantId, globalLocationId]);

	// Preselect today (store timezone) so slots load straight away.
	useEffect(() => {
		if (!activeVariant || availability.selectedDate) return;
		const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
		availability.setSelectedDate(todayStr);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeVariant, availability.selectedDate]);

	const handleDateSelect = useCallback(
		(date: string | null) => {
			availability.setSelectedDate(date);
			addOns.resetSelection();
		},
		[availability, addOns],
	);

	const handleDurationChange = useCallback(
		(units: number) => {
			duration.setUnits(units);
			availability.resetSlot();
			addOns.resetSelection();
		},
		[duration, availability, addOns],
	);

	const handlePreSelectStaff = useCallback(
		(staffId: string | null) => {
			setSelectedStaffId(staffId);
			setConfirmedStaffId(null);
			availability.resetSlot();
			addOns.resetSelection();
		},
		[availability, addOns],
	);

	const handleSlotSelect = useCallback(
		(slot: CurrentAvailabilitySlot) => {
			availability.selectSlot(slot);
			setConfirmedStaffId(null);
			addOns.resetSelection();
			const eligibleStaff = staffForLocation.filter((s) => slot.staffMemberIds?.includes(s.id));
			const skipsWho = selectedStaffId !== null || eligibleStaff.length <= 1;
			setStep(skipsWho ? 'extras' : 'who');
		},
		[availability, addOns, staffForLocation, selectedStaffId],
	);

	const handleStaffConfirm = useCallback((staffId: string | null) => {
		setConfirmedStaffId(staffId);
		setStep('extras');
	}, []);

	// Skip the extras step when the service has no add-ons (once they have loaded).
	const extrasSkipped = !addOns.addOnsLoading && addOns.availableAddOns.length === 0;
	const stepAfterExtras: BookingStep = questions.length > 0 ? 'questions' : 'details';

	const handleContinueFromExtras = useCallback(() => {
		setStep(stepAfterExtras);
	}, [stepAfterExtras]);

	useEffect(() => {
		if (step === 'extras' && extrasSkipped) setStep(stepAfterExtras);
	}, [step, extrasSkipped, stepAfterExtras]);

	const handleContinueFromQuestions = useCallback(() => {
		setStep('details');
	}, []);

	const customerPayload = useMemo(() => {
		const extra = {
			firstName: firstName.trim() || undefined,
			lastName: lastName.trim() || undefined,
			phone: phone.trim() || undefined,
		};
		return customerId
			? { kind: 'existing' as const, customerId, ...extra }
			: { kind: 'new' as const, email: email.trim(), ...extra };
	}, [customerId, email, firstName, lastName, phone]);

	const addOnPayload = useMemo(
		() =>
			Array.from(addOns.selectedAddOns.entries())
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([addOnId, quantity]) => {
					const addOn = addOns.availableAddOns.find((a) => a.id === addOnId);
					return addOn?.durationMultiplied ? { addOnId } : { addOnId, quantity };
				}),
		[addOns.selectedAddOns, addOns.availableAddOns],
	);

	const uploadSig = useMemo(
		() =>
			Object.entries(uploads.uploads)
				.map(([q, list]) => `${q}:${list.filter((u) => u.status === 'done').map((u) => u.key).join(',')}`)
				.sort()
				.join('|'),
		[uploads.uploads],
	);

	// Everything sent with the hold; any change after committing means it must be replaced.
	const signature = useMemo(
		() =>
			JSON.stringify({
				variant: activeVariant?.id ?? null,
				slot: availability.selectedSlot,
				staff: finalStaffId,
				location: selectedLocationId,
				attendees,
				addOnPayload,
				attributes,
				address,
				customerPayload,
				answers: Object.entries(answers).filter(([, v]) => v.trim()).sort(([a], [b]) => a.localeCompare(b)),
				uploadSig,
			}),
		[activeVariant?.id, availability.selectedSlot, finalStaffId, selectedLocationId, attendees, addOnPayload, attributes, address, customerPayload, answers, uploadSig],
	);
	const committed = committedSignature !== null && committedSignature === signature;

	const handleSubmitDetails = useCallback(async () => {
		if (!activeVariant || !availability.selectedSlot) return;
		setSubmitting(true);
		setError(null);
		setFieldErrors({});

		try {
			const slot = availability.selectedSlot;
			let files: { fileIdsFor: (id: string) => string[]; filenamesFor: (id: string) => string[] } = uploads;
			if (linkedFiles) {
				// The earlier hold already claimed these files; a new appointment needs fresh records.
				const fresh = await uploads.reuploadAll();
				files = { fileIdsFor: (id) => fresh[id]?.fileIds ?? [], filenamesFor: (id) => fresh[id]?.filenames ?? [] };
			}
			const answerPayload = buildAnswerPayload(questions, answers, files);

			const res = await fetch('/api/book', {
				method: 'POST',
				headers: cartHeaders(),
				body: JSON.stringify({
					slot: {
						productId: activeVariant.id,
						fromDate: slot.fromDate,
						fromTime: slot.fromTime,
						toDate: slot.toDate,
						toTime: slot.toTime,
						staffMemberId: finalStaffId ?? slot.staffMemberIds?.[0] ?? null,
						locationId: selectedLocationId ?? slot.locationIds?.[0] ?? null,
					},
					numberOfAttendees: attendees,
					addOns: addOnPayload,
					customer: customerPayload,
					checkoutQuestionAnswers: answerPayload,
					customAttributes: attributes,
					...(address ? { address } : {}),
					replaceItemId: committedItemId,
				}),
			});
			const data = (await res.json().catch(() => null)) as {
				cart?: { id?: string; items?: unknown[] } & Record<string, unknown>;
				itemId?: string | null;
				error?: string;
				code?: string;
				errors?: FieldErrors;
			} | null;

			if (!res.ok) {
				if (data?.cart?.id) {
					setCommittedCartId(data.cart.id);
					setCommittedItemId(data.itemId ?? null);
				}
				if (data?.code === 'slot_unavailable') {
					availability.resetSlot();
					setStep('when');
				}
				if (data?.errors) setFieldErrors(data.errors);
				throw new Error(data?.error || 'Could not save your details');
			}

			if (data?.cart) {
				setCart(data.cart as unknown as Parameters<typeof setCart>[0]);
				setCommittedCartId(data.cart.id ?? null);
			}
			setCommittedItemId(data?.itemId ?? null);
			setLinkedFiles(answerPayload.some((a) => (a.fileIds?.length ?? 0) > 0));
			setCommittedSignature(signature);
			setProvider(null);
			setPaymentData(null);
			setStep('payment');
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Could not save your details');
		} finally {
			setSubmitting(false);
		}
	}, [
		activeVariant,
		availability,
		uploads,
		linkedFiles,
		questions,
		answers,
		cartHeaders,
		finalStaffId,
		selectedLocationId,
		attendees,
		addOnPayload,
		customerPayload,
		attributes,
		address,
		committedItemId,
		setCart,
		signature,
	]);

	const checkoutCustomer = useMemo(() => {
		const { kind: _kind, ...customer } = customerPayload;
		void _kind;
		return {
			customer,
			...(address
				? {
						deliveryAddress: {
							...address,
							firstName: customerPayload.firstName,
							lastName: customerPayload.lastName,
							phone: customerPayload.phone,
						},
					}
				: {}),
		};
	}, [customerPayload, address]);

	const handleSubmitCheckout = useCallback(
		async (stripePaymentIntentId?: string) => {
			setSubmitting(true);
			setError(null);
			try {
				const res = await fetch('/api/checkout/submit', {
					method: 'POST',
					headers: cartHeaders(),
					body: JSON.stringify({
						appointmentsSettings: { markAsScheduled: true },
						...checkoutCustomer,
						...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
					}),
				});
				if (!res.ok) {
					const data = await res.json().catch(() => null);
					throw new Error(data?.error || 'Checkout failed');
				}
				const data = await res.json();
				if (data.auth?.accessToken) {
					await signIn('checkout-token', {
						accessToken: data.auth.accessToken,
						refreshToken: data.auth.refreshToken,
						customerId: data.customer?.id ?? '',
						customerEmail: data.customer?.email ?? email,
						customerFirstName: data.customer?.firstName ?? firstName,
						customerLastName: data.customer?.lastName ?? lastName,
						redirect: false,
					});
				}
				clearCart();
				router.push(`/thank-you?orderId=${encodeURIComponent(data.order?.id ?? '')}`);
			} catch (err: unknown) {
				setError(err instanceof Error ? err.message : 'Checkout failed');
				setSubmitting(false);
			}
		},
		[cartHeaders, checkoutCustomer, email, firstName, lastName, clearCart, router],
	);

	// Cash and "nothing to pay" show a confirm panel (PaymentStep); no auto-submit.
	const handleSelectProvider = useCallback(
		async (providerName: string) => {
			setProvider(providerName);
			setPaymentData(null);
			setError(null);
			setSubmitting(true);
			try {
				const res = await fetch('/api/checkout/start', {
					method: 'POST',
					headers: cartHeaders(),
					body: JSON.stringify({ provider: providerName, ...checkoutCustomer }),
				});
				if (!res.ok) {
					const data = await res.json().catch(() => null);
					throw new Error(data?.error || 'Could not start checkout');
				}
				const data: CheckoutStartResponse = await res.json();
				if (data.redirectUrl) {
					window.location.href = data.redirectUrl;
					return;
				}
				setPaymentData(data);
			} catch (err: unknown) {
				setError(err instanceof Error ? err.message : 'Could not start checkout');
				setProvider(null);
			} finally {
				setSubmitting(false);
			}
		},
		[cartHeaders, checkoutCustomer],
	);

	const goToStep = useCallback((target: BookingStep) => {
		setStep(target);
	}, []);

	const questionsSkipped = questions.length === 0;

	const canEnter = useCallback(
		(target: BookingStep): boolean => {
			if (target === 'when') return true;
			if (target === 'who') return !!availability.selectedSlot && !whoSkipped;
			const slotAndStaffReady = !!availability.selectedSlot && (whoSkipped || !!confirmedStaffId);
			if (target === 'extras') return slotAndStaffReady;
			if (target === 'questions') return slotAndStaffReady && !questionsSkipped;
			if (target === 'details') return slotAndStaffReady;
			if (target === 'payment') return slotAndStaffReady && committed;
			return false;
		},
		[availability.selectedSlot, whoSkipped, confirmedStaffId, committed, questionsSkipped],
	);

	const stepCompleted = useMemo<Record<BookingStep, boolean>>(
		() => ({
			when: !!availability.selectedSlot,
			who: whoSkipped || !!confirmedStaffId,
			extras: extrasSkipped || (step !== 'when' && step !== 'who' && step !== 'extras'),
			questions: questionsSkipped || step === 'details' || step === 'payment',
			details: committed,
			payment: false,
		}),
		[availability.selectedSlot, whoSkipped, confirmedStaffId, step, committed, questionsSkipped, extrasSkipped],
	);

	// If the guest edits something after committing, leave the payment step.
	useEffect(() => {
		if (step === 'payment' && !committed) setStep('details');
	}, [step, committed]);

	const questionsValid = questionsComplete(questions, answers, uploads.fileIdsFor) && !uploads.busy;
	const emailValid = customerId !== null || /^\S+@\S+\.\S+$/.test(email.trim());
	const detailsValid =
		emailValid &&
		firstName.trim().length > 0 &&
		lastName.trim().length > 0 &&
		phone.trim().length >= 6 &&
		(!needsPickupAddress || pickupAddress.trim().length > 3);

	return {
		// Product
		product,
		activeVariant,
		variants,
		hasVariants,
		selectedVariantId,
		setSelectedVariantId,
		loading: productData.loading,
		error: error ?? productData.error,
		setError,
		fieldErrors,

		// Staff & location
		selectedStaffId,
		setSelectedStaffId: handlePreSelectStaff,
		confirmedStaffId,
		setConfirmedStaffId: handleStaffConfirm,
		selectedLocationId,
		setSelectedLocationId,
		selectedLocation,
		finalStaffId,
		staffForLocation,
		slotStaff,
		whoSkipped,

		// Length (allowCustomDuration)
		duration,
		setDurationUnits: handleDurationChange,

		// Availability
		selectedDate: availability.selectedDate,
		setSelectedDate: handleDateSelect,
		slots: availability.slots,
		slotsLoading: availability.slotsLoading,
		selectedSlot: availability.selectedSlot,
		handleSlotSelect,

		// Attendees
		attendees,
		setAttendees,

		// Add-ons
		availableAddOns: addOns.availableAddOns,
		addOnsLoading: addOns.addOnsLoading,
		selectedAddOns: addOns.selectedAddOns,
		addOnsTotal: addOns.addOnsTotal,
		updateAddOnQuantity: addOns.updateQuantity,
		bookedDurationUnits,
		extrasSkipped,
		handleContinueFromExtras,

		// Customer
		email,
		setEmail,
		firstName,
		setFirstName,
		lastName,
		setLastName,
		phone,
		setPhone,
		customerId,

		// Appointment extras
		customAttributes: attributes,
		setCustomAttribute,
		needsPickupAddress,
		pickupAddress,
		setPickupAddress,

		// Questions
		questions,
		questionsSkipped,
		questionsValid,
		answers,
		setAnswers,
		uploads,
		handleContinueFromQuestions,

		// Details submit
		detailsValid,
		handleSubmitDetails,

		// Payment
		providers,
		provider,
		paymentData,
		handleSelectProvider,
		handleSubmitCheckout,

		// Flow
		step,
		setStep,
		goToStep,
		canEnter,
		stepCompleted,
		committed,
		submitting,
		isExpired,

		// Formatting
		formatCustom,
		formatTimeRange,
		timezone,
	};
}
