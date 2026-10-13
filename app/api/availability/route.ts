import '@/lib/opencals';
import { ProductService, type ProductGetCurrentAvailabilitiesData } from '@opencals/storefront-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const productId = searchParams.get('productId');
	const date = searchParams.get('date');
	const timezone = searchParams.get('timezone') ?? undefined;
	const staffMemberId = searchParams.get('staffMemberId') ?? undefined;
	const locationId = searchParams.get('locationId') ?? undefined;
	// Booked length in seconds, only for custom-duration products (fixed-length ones reject it).
	const duration = searchParams.get('duration') ?? undefined;
	// The booking being moved, so its own slot doesn't count as taken.
	const excludeAppointmentId = searchParams.get('excludeAppointmentId') ?? undefined;

	if (!productId || !date) {
		return NextResponse.json({ error: 'productId and date are required' }, { status: 400 });
	}

	// `excludeAppointmentId` is supported by the API but not yet in the SDK 0.3.14 types.
	const query: ProductGetCurrentAvailabilitiesData['query'] & { excludeAppointmentId?: string } = {
		date,
		timezone,
		staffMemberId,
		locationId,
		duration,
		excludeAppointmentId,
	};

	try {
		const { data } = await ProductService.getCurrentAvailabilities({
			path: { productId },
			query,
			throwOnError: true,
		});
		return NextResponse.json(data);
	} catch (err) {
		return handleApiError(err);
	}
}
