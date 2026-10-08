'use client';

import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/site-config';

const FORMAT = new Intl.DateTimeFormat('en-GB', {
	hour: '2-digit',
	minute: '2-digit',
	hour12: false,
	timeZone: siteConfig.timezone,
});

/** Live local time at the garage ("21:04"). Renders a placeholder until mounted. */
export function DubaiClock({ className }: { className?: string }) {
	const [now, setNow] = useState<string | null>(null);

	useEffect(() => {
		const tick = () => setNow(FORMAT.format(new Date()));
		tick();
		const id = window.setInterval(tick, 15_000);
		return () => window.clearInterval(id);
	}, []);

	return (
		<span className={className}>
			<span className="tabular" suppressHydrationWarning>
				{now ?? '--:--'}
			</span>
		</span>
	);
}
