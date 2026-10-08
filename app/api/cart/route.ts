import '@/lib/opencals';
import { CartService } from '@opencals/storefront-sdk';
import { getAccessToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';
import { readCartId } from './cart-id';

export async function GET(request: NextRequest) {
	const cartId = readCartId(request);
	if (!cartId) {
		return NextResponse.json({ error: 'No cart ID' }, { status: 404 });
	}

	try {
		const token = await getAccessToken();
		const { data } = await CartService.get({
			headers: { Authorization: `Bearer ${token ?? ''}`, 'X-Cart-Id': cartId },
			throwOnError: true,
		});
		return NextResponse.json(data);
	} catch (err) {
		return handleApiError(err);
	}
}

export async function POST(request: NextRequest) {
	const cartId = readCartId(request);

	try {
		const token = await getAccessToken();
		const { data } = await CartService.createOrGet({
			headers: { Authorization: `Bearer ${token ?? ''}`, 'X-Cart-Id': cartId },
			throwOnError: true,
		});
		return NextResponse.json(data);
	} catch (err) {
		return handleApiError(err);
	}
}
