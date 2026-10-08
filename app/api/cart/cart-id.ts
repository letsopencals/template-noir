import type { NextRequest } from 'next/server';

/** The cart id the browser sends in `X-Cart-Id` (see `contexts/cart-context.tsx`). */
export function readCartId(request: NextRequest): string {
	return request.headers.get('X-Cart-Id') ?? '';
}
