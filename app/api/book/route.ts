import '@/lib/opencals';
import { AppointmentService, CartService, CheckoutService, OpencalsApiError } from '@opencals/storefront-sdk';
import type { AppointmentAddress, CartResponse } from '@opencals/storefront-sdk';
import { getAccessToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';

interface AddOnSelection {
	addOnId: string;
	quantity?: number;
}

interface QuestionAnswerInput {
	questionId: string;
	question: string;
	answer: string;
	/** Ids from /api/uploads/presign, for file-upload questions. */
	fileIds?: string[];
}

interface CustomerInput {
	kind: 'new' | 'existing';
	customerId?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
}

interface BookInput {
	slot: {
		productId: string;
		fromDate: string;
		fromTime: string;
		toDate: string;
		toTime: string;
		staffMemberId?: string | null;
		locationId?: string | null;
	};
	numberOfAttendees?: number;
	addOns?: AddOnSelection[];
	customer?: CustomerInput;
	checkoutQuestionAnswers?: QuestionAnswerInput[];
	/** String key/values stored on the appointment (handover_time, return_time, …). */
	customAttributes?: Record<string, string>;
	/** Delivery address. The backend stores it only when the location is a `delivery` location. */
	address?: AppointmentAddress;
	/**
	 * Cart item from an earlier attempt in the same flow (the guest changed dates
	 * or extras after reserving). Removed first so its pending hold doesn't block
	 * the new slot.
	 */
	replaceItemId?: string | null;
}

/** Keep only string → string pairs; the backend enforces its own limits. */
function sanitizeAttributes(input: Record<string, unknown>): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [k, v] of Object.entries(input)) {
		if (typeof k === 'string' && k && typeof v === 'string' && v.trim()) out[k] = v.trim();
	}
	return out;
}

const ADDRESS_KEYS = ['addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country'] as const;

function sanitizeAddress(input: unknown): AppointmentAddress | null {
	if (!input || typeof input !== 'object') return null;
	const src = input as Record<string, unknown>;
	const out: AppointmentAddress = {};
	for (const key of ADDRESS_KEYS) {
		const v = src[key];
		if (typeof v === 'string' && v.trim()) out[key] = v.trim().slice(0, 255);
	}
	if (out.country) out.country = out.country.toUpperCase();
	return out.addressLine1 || out.city ? out : null;
}

function sanitizeAnswers(input: unknown): QuestionAnswerInput[] {
	if (!Array.isArray(input)) return [];
	return input
		.filter((a): a is QuestionAnswerInput => !!a && typeof a.questionId === 'string' && typeof a.answer === 'string')
		.map((a) => ({
			questionId: a.questionId,
			question: typeof a.question === 'string' ? a.question : '',
			answer: a.answer,
			...(Array.isArray(a.fileIds) && a.fileIds.length > 0
				? { fileIds: a.fileIds.filter((id): id is string => typeof id === 'string') }
				: {}),
		}));
}

/** Slot conflicts read better as one plain sentence than the backend's wording. */
function friendlySlotError(err: unknown): NextResponse | null {
	if (!(err instanceof OpencalsApiError)) return null;
	const msg = err.message.toLowerCase();
	const isSlotConflict =
		err.status === 409 ||
		msg.includes('not available') ||
		msg.includes('availability') ||
		msg.includes('already booked') ||
		msg.includes('maximum attendees') ||
		msg.includes('continuous');
	if (!isSlotConflict) return null;
	return NextResponse.json(
		{ error: 'These dates are no longer free. Choose different dates and try again.', code: 'slot_unavailable' },
		{ status: 409 },
	);
}

/**
 * Reserve one appointment in the cart:
 *   1. create/get the cart
 *   2. drop the item from an earlier attempt (`replaceItemId`)
 *   3. create the appointment (slot, add-ons, customer, custom attributes, address)
 *   4. save checkout answers with `CheckoutService.saveAnswers`, which stores
 *      the questionId and links uploaded `fileIds` (create-time answers do neither)
 *
 * Response: { appointment, cart, itemId }. If step 4 fails the appointment is
 * already in the cart, so the error response still carries { cart, itemId } and
 * the client passes `replaceItemId` on retry.
 */
export async function POST(request: NextRequest) {
	const cartIdHeader = request.headers.get('X-Cart-Id') ?? '';

	let body: BookInput;
	try {
		body = (await request.json()) as BookInput;
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { slot, numberOfAttendees, addOns, customer, customAttributes, replaceItemId } = body;
	if (!slot?.productId || !slot?.fromDate || !slot?.fromTime || !slot?.toDate || !slot?.toTime) {
		return NextResponse.json({ error: 'Invalid slot data' }, { status: 400 });
	}

	const token = await getAccessToken();
	const authHeaders = { Authorization: `Bearer ${token ?? ''}` };
	const answers = sanitizeAnswers(body.checkoutQuestionAnswers);
	const address = sanitizeAddress(body.address);

	let cart: CartResponse;
	try {
		const res = await CartService.createOrGet({
			headers: { ...authHeaders, 'X-Cart-Id': cartIdHeader },
			throwOnError: true,
		});
		cart = res.data;
	} catch (err) {
		return handleApiError(err);
	}

	if (replaceItemId && cart.items?.some((i) => i.id === replaceItemId)) {
		try {
			await CartService.removeItem({ path: { itemId: replaceItemId }, headers: authHeaders, throwOnError: true });
		} catch {
			// Already gone (expired hold) — carry on with the new booking.
		}
	}

	let appointmentId: string;
	let appointment: unknown;
	try {
		const res = await AppointmentService.create({
			body: {
				slot: {
					productId: slot.productId,
					fromDate: slot.fromDate,
					fromTime: slot.fromTime,
					toDate: slot.toDate,
					toTime: slot.toTime,
					staffMemberId: slot.staffMemberId ?? null,
					locationId: slot.locationId ?? null,
				},
				numberOfAttendees: numberOfAttendees ?? 1,
				cartId: cart.id,
				addOns: (addOns ?? [])
					.filter((a) => a?.addOnId)
					.map((a) => ({
						addOnId: a.addOnId,
						...(typeof a.quantity === 'number' ? { quantity: a.quantity } : {}),
					})),
				...(customer
					? {
							customer:
								customer.kind === 'existing' && customer.customerId
									? { customerId: customer.customerId }
									: {
											externalId: customer.email ?? '',
											email: customer.email ?? '',
											firstName: customer.firstName,
											lastName: customer.lastName,
											...(customer.phone ? { phone: customer.phone } : {}),
										},
						}
					: {}),
				...(customAttributes && Object.keys(customAttributes).length > 0
					? { customAttributes: sanitizeAttributes(customAttributes) }
					: {}),
				...(address ? { address } : {}),
			},
			headers: authHeaders,
			throwOnError: true,
		});
		appointment = res.data;
		appointmentId = res.data.id;
	} catch (err) {
		return friendlySlotError(err) ?? handleApiError(err);
	}

	const loadCart = async () =>
		(await CartService.get({ headers: { ...authHeaders, 'X-Cart-Id': cart.id }, throwOnError: true })).data;

	if (answers.length > 0) {
		try {
			await CheckoutService.saveAnswers({
				body: { answers },
				headers: { ...authHeaders, 'X-Cart-Id': cart.id },
				throwOnError: true,
			});
		} catch (err) {
			const errorResponse = handleApiError(err, 'Could not save your answers');
			const errorBody = (await errorResponse.json()) as Record<string, unknown>;
			const finalCart = await loadCart().catch(() => cart);
			const itemId = finalCart.items?.find((i) => i.appointmentId === appointmentId)?.id ?? null;
			return NextResponse.json(
				{ ...errorBody, error: `Your car is held, but your answers didn't save: ${String(errorBody.error)}`, cart: finalCart, itemId },
				{ status: errorResponse.status },
			);
		}
	}

	try {
		const finalCart = await loadCart();
		const itemId = finalCart.items?.find((i) => i.appointmentId === appointmentId)?.id ?? null;
		return NextResponse.json({ appointment, cart: finalCart, itemId });
	} catch (err) {
		return handleApiError(err);
	}
}
