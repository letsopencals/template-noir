'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import type {
	AppointmentAddress,
	CartResponse,
	CheckoutStartResponse,
	ProductListVariant,
} from '@opencals/storefront-sdk';
import type { RentalSlotTimes } from '@/lib/rental';
import { useCart } from '@/contexts/cart-context';
import { useBookingAddOns } from '@/hooks/use-booking-add-ons';
import { buildAnswerPayload, questionsComplete, useCheckoutQuestions } from '@/hooks/use-checkout-questions';
import { useCartExpiry } from '@/hooks/use-cart-expiry';
import { useFileUploads } from '@/hooks/use-file-upload';
import { usePaymentProviders } from '@/hooks/use-payment-providers';

export interface RentalBookingInput {
	/** The car product: `id` books, `slug` keys questions, `variant` keys add-ons. */
	car: { id: string; slug: string; variant: ProductListVariant | null } | null;
	/** UTC slot from `toAppointmentSlot(from, until, tz)`; null until both dates are picked. */
	slot: RentalSlotTimes | null;
	/** Rental days = base units (per-day extras are multiplied by this). */
	units: number;
	/** Garage (physical) or delivery location id. */
	locationId: string | null;
	/** handover_time, return_time, collect_address, flight_number. Empty values are dropped. */
	customAttributes: Record<string, string>;
	/** Delivery address (only for a delivery location). */
	address: AppointmentAddress | null;
	/** Called when the server says the dates were taken in the meantime. */
	onSlotUnavailable?: () => void;
}

interface Reservation {
	cart: CartResponse;
	itemId: string | null;
	/** Snapshot of everything sent; a mismatch means the hold is out of date. */
	signature: string;
	/** True when file answers were linked to this booking (re-creating it needs fresh uploads). */
	linkedFiles: boolean;
}

type FieldErrors = Record<string, string[]>;

async function readJson<T>(res: Response): Promise<T | null> {
	return (await res.json().catch(() => null)) as T | null;
}

/**
 * Single-page car-rental booking (`/book`).
 *
 * Owns extras, documents (questions + uploads), guest details, the cart hold
 * and checkout. `reserve()` puts the car in a cart via `/api/book`; any later
 * change to dates, extras, answers or details marks the hold `stale`, and the
 * next `reserve()` replaces it (`replaceItemId`) so the old hold never blocks
 * the new dates. Payment uses the hold's own cart id and expiry, independent
 * of the cart context.
 */
export function useRentalBooking(input: RentalBookingInput) {
	const { car, slot, units, locationId, customAttributes, address, onSlotUnavailable } = input;
	const router = useRouter();
	const { data: session } = useSession();
	const { cartId: contextCartId, setCart, clearCart } = useCart();

	// Details
	const [email, setEmail] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [phone, setPhone] = useState('');
	const [customerId, setCustomerId] = useState<string | null>(null);
	const prefilledRef = useRef(false);

	useEffect(() => {
		if (prefilledRef.current || !session?.customer) return;
		prefilledRef.current = true;
		const c = session.customer;
		if (c.id) setCustomerId(c.id);
		if (c.email) setEmail(c.email);
		if (c.firstName) setFirstName(c.firstName);
		if (c.lastName) setLastName(c.lastName);
	}, [session]);

	// Extras, questions, uploads
	const addOns = useBookingAddOns({
		activeVariant: car?.variant ?? null,
		locationId,
		staffMemberId: null,
		bookedDurationUnits: Math.max(units, 1),
	});
	const questions = useCheckoutQuestions(car?.slug ?? null);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const uploads = useFileUploads();

	// Hold + payment
	const [reservation, setReservation] = useState<Reservation | null>(null);
	const [provider, setProvider] = useState<string | null>(null);
	const [paymentData, setPaymentData] = useState<CheckoutStartResponse | null>(null);
	const [reserving, setReserving] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [slotTaken, setSlotTaken] = useState(false);

	const timeRemaining = useCartExpiry(reservation?.cart.expiresAt);
	const isExpired = timeRemaining !== null && timeRemaining <= 0;
	const providers = usePaymentProviders(reservation?.cart.id ?? null);

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

	const customer = useMemo(
		() =>
			customerId
				? {
						kind: 'existing' as const,
						customerId,
						firstName: firstName.trim() || undefined,
						lastName: lastName.trim() || undefined,
						phone: phone.trim() || undefined,
					}
				: {
						kind: 'new' as const,
						email: email.trim(),
						firstName: firstName.trim() || undefined,
						lastName: lastName.trim() || undefined,
						phone: phone.trim() || undefined,
					},
		[customerId, email, firstName, lastName, phone],
	);

	const attributes = useMemo(() => {
		const out: Record<string, string> = {};
		for (const [k, v] of Object.entries(customAttributes)) if (v.trim()) out[k] = v.trim();
		return out;
	}, [customAttributes]);

	// Upload keys (not file ids, which change on re-upload) stand in for file answers.
	const uploadSig = useMemo(
		() =>
			Object.entries(uploads.uploads)
				.map(([q, list]) => `${q}:${list.filter((u) => u.status === 'done').map((u) => u.key).join(',')}`)
				.sort()
				.join('|'),
		[uploads.uploads],
	);

	const signature = useMemo(
		() =>
			JSON.stringify({
				car: car?.id ?? null,
				slot,
				locationId,
				addOnPayload,
				attributes,
				address,
				customer,
				answers: Object.entries(answers).filter(([, v]) => v.trim()).sort(([a], [b]) => a.localeCompare(b)),
				uploadSig,
			}),
		[car?.id, slot, locationId, addOnPayload, attributes, address, customer, answers, uploadSig],
	);

	const stale = reservation !== null && reservation.signature !== signature;
	const held = reservation !== null && !stale && !isExpired;

	// A new hold invalidates any started payment (amounts may differ).
	useEffect(() => {
		if (!held) {
			setProvider(null);
			setPaymentData(null);
		}
	}, [held]);

	useEffect(() => {
		setSlotTaken(false);
	}, [slot?.fromDate, slot?.toDate, car?.id]);

	const questionsValid = questionsComplete(questions, answers, uploads.fileIdsFor);
	const emailValid = customerId !== null || /^\S+@\S+\.\S+$/.test(email.trim());
	const detailsValid = emailValid && firstName.trim().length > 0 && lastName.trim().length > 0 && phone.trim().length >= 6;
	const canReserve = !!car && !!slot && units > 0 && detailsValid && questionsValid && !uploads.busy && !reserving;

	const reserve = useCallback(async (): Promise<boolean> => {
		if (!car || !slot) return false;
		setReserving(true);
		setError(null);
		setFieldErrors({});
		try {
			// Re-creating a booking whose files were already linked needs fresh file records.
			let files: { fileIdsFor: (id: string) => string[]; filenamesFor: (id: string) => string[] } = uploads;
			if (reservation?.linkedFiles) {
				const fresh = await uploads.reuploadAll();
				files = {
					fileIdsFor: (id) => fresh[id]?.fileIds ?? [],
					filenamesFor: (id) => fresh[id]?.filenames ?? [],
				};
			}
			const answerPayload = buildAnswerPayload(questions, answers, files);
			const cartIdForRequest = reservation?.cart.id ?? contextCartId;

			const res = await fetch('/api/book', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(cartIdForRequest ? { 'X-Cart-Id': cartIdForRequest } : {}),
				},
				body: JSON.stringify({
					slot: { productId: car.id, ...slot, staffMemberId: null, locationId },
					numberOfAttendees: 1,
					addOns: addOnPayload,
					customer,
					checkoutQuestionAnswers: answerPayload,
					customAttributes: attributes,
					...(address ? { address } : {}),
					replaceItemId: reservation?.itemId ?? null,
				}),
			});
			const data = await readJson<{
				cart?: CartResponse;
				itemId?: string | null;
				error?: string;
				code?: string;
				errors?: FieldErrors;
			}>(res);

			if (!res.ok) {
				if (data?.code === 'slot_unavailable') {
					setSlotTaken(true);
					setReservation(null);
					onSlotUnavailable?.();
				} else if (data?.cart) {
					// Held, but answers didn't save: keep the hold so a retry replaces it.
					setReservation({ cart: data.cart, itemId: data.itemId ?? null, signature: '', linkedFiles: false });
				}
				if (data?.errors) setFieldErrors(data.errors);
				setError(data?.error || 'Could not reserve this car. Try again.');
				return false;
			}
			if (!data?.cart) throw new Error('Could not reserve this car. Try again.');

			setCart(data.cart);
			setReservation({
				cart: data.cart,
				itemId: data.itemId ?? null,
				signature,
				linkedFiles: answerPayload.some((a) => (a.fileIds?.length ?? 0) > 0),
			});
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not reserve this car. Try again.');
			return false;
		} finally {
			setReserving(false);
		}
	}, [
		car,
		slot,
		uploads,
		reservation,
		questions,
		answers,
		contextCartId,
		locationId,
		addOnPayload,
		customer,
		attributes,
		address,
		onSlotUnavailable,
		setCart,
		signature,
	]);

	const cartHeaders = useCallback(
		(): Record<string, string> => ({
			'Content-Type': 'application/json',
			...(reservation ? { 'X-Cart-Id': reservation.cart.id } : {}),
		}),
		[reservation],
	);

	const checkoutCustomer = useMemo(
		() => ({
			customer: customerId
				? { customerId, firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone }
				: { email: customer.email, firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone },
			...(address
				? {
						deliveryAddress: {
							...address,
							firstName: customer.firstName,
							lastName: customer.lastName,
							phone: customer.phone,
						},
					}
				: {}),
		}),
		[customerId, customer, address],
	);

	const submitCheckout = useCallback(
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
				const data = await readJson<{
					error?: string;
					order?: { id?: string };
					customer?: { id?: string; email?: string; firstName?: string; lastName?: string };
					auth?: { accessToken?: string; refreshToken?: string };
				}>(res);
				if (!res.ok) throw new Error(data?.error || 'Checkout failed');
				if (data?.auth?.accessToken) {
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
				router.push(`/thank-you?orderId=${encodeURIComponent(data?.order?.id ?? '')}`);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Checkout failed');
				setSubmitting(false);
			}
		},
		[cartHeaders, checkoutCustomer, email, firstName, lastName, clearCart, router],
	);

	const selectProvider = useCallback(
		async (providerName: string) => {
			if (!held) return;
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
				const data = await readJson<CheckoutStartResponse & { error?: string }>(res);
				if (!res.ok || !data) throw new Error(data?.error || 'Could not start checkout');
				if (data.redirectUrl) {
					window.location.href = data.redirectUrl;
					return;
				}
				setPaymentData(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Could not start checkout');
				setProvider(null);
			} finally {
				setSubmitting(false);
			}
		},
		[held, cartHeaders, checkoutCustomer],
	);

	return {
		// extras
		availableAddOns: addOns.availableAddOns,
		addOnsLoading: addOns.addOnsLoading,
		selectedAddOns: addOns.selectedAddOns,
		addOnsTotal: addOns.addOnsTotal,
		updateAddOnQuantity: addOns.updateQuantity,
		// documents
		questions,
		answers,
		setAnswers,
		uploads,
		questionsValid,
		// details
		email,
		setEmail,
		firstName,
		setFirstName,
		lastName,
		setLastName,
		phone,
		setPhone,
		customerId,
		detailsValid,
		fieldErrors,
		// hold
		canReserve,
		reserve,
		reserving,
		reservation,
		held,
		stale,
		slotTaken,
		timeRemaining,
		isExpired,
		// payment
		providers,
		provider,
		paymentData,
		selectProvider,
		submitCheckout,
		submitting,
		error,
		setError,
	};
}

export type RentalBooking = ReturnType<typeof useRentalBooking>;
