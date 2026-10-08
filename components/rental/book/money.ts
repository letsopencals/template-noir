const formatters = new Map<string, Intl.NumberFormat>();

/** "AED 4,500" (no decimals; rental prices are whole dirhams). */
export function formatMoney(amount: number, currency = 'AED'): string {
	let f = formatters.get(currency);
	if (!f) {
		f = new Intl.NumberFormat('en-AE', { style: 'currency', currency, maximumFractionDigits: 0, minimumFractionDigits: 0 });
		formatters.set(currency, f);
	}
	return f.format(amount);
}

/** "mm:ss" for the hold countdown. */
export function formatCountdown(seconds: number): string {
	const s = Math.max(0, Math.floor(seconds));
	return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
