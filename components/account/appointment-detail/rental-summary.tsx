import { DetailRow, Panel } from '@/components/account/account-ui';
import { dayLabel, formatLocalDate, type BookingMeta } from '@/components/account/booking-meta';
import { siteConfig } from '@/lib/site-config';

/** Pick-up → return plate plus the handover facts stored on the booking. */
export function RentalSummary({ meta }: { meta: BookingMeta }) {
	return (
		<Panel title="Your rental">
			<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-y border-[var(--color-line)] py-6">
				<DatePlate label="Pick-up" date={meta.pickUpDate} time={meta.handoverTime} />
				<div className="flex flex-col items-center gap-2 px-2">
					<span className="tabular text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-primary)]">
						{dayLabel(meta.days)}
					</span>
					<span aria-hidden className="block h-px w-12 bg-[var(--color-line-strong)] sm:w-20" />
				</div>
				<DatePlate label="Return" date={meta.returnDate} time={meta.returnTime} align="right" />
			</div>

			<dl className="mt-2 divide-y divide-[var(--color-line)]">
				<DetailRow label={meta.isDelivery ? 'Delivered to' : 'Collect from'}>
					<span className="block">{meta.isDelivery ? 'Your address' : (meta.locationTitle ?? 'Our garage')}</span>
					{meta.address ? <span className="mt-1 block text-[var(--color-ink-muted)]">{meta.address}</span> : null}
				</DetailRow>
				{meta.collectAddress ? <DetailRow label="We collect from">{meta.collectAddress}</DetailRow> : null}
				{meta.handoverTime ? <DetailRow label="Handover window">{meta.handoverTime}</DetailRow> : null}
				{meta.returnTime ? <DetailRow label="Return window">{meta.returnTime}</DetailRow> : null}
				{meta.flightNumber ? (
					<DetailRow label="Flight">
						<span className="tabular">{meta.flightNumber}</span>
					</DetailRow>
				) : null}
			</dl>

			<p className="mt-5 text-xs leading-relaxed text-[var(--color-ink-dim)]">
				Dates are in Dubai time ({siteConfig.timezone}). Bring your driving licence and passport or Emirates ID; the
				security deposit is held on a card at handover, not charged online.
			</p>
		</Panel>
	);
}

function DatePlate({
	label,
	date,
	time,
	align = 'left',
}: {
	label: string;
	date: string;
	time: string | null;
	align?: 'left' | 'right';
}) {
	return (
		<div className={align === 'right' ? 'text-right' : undefined}>
			<p className="eyebrow">{label}</p>
			<p className="heading-display mt-3 text-2xl text-[var(--color-ink)] sm:text-3xl">{formatLocalDate(date, 'D MMM')}</p>
			<p className="tabular mt-1.5 text-xs text-[var(--color-ink-muted)]">
				{formatLocalDate(date, 'dddd YYYY')}
				{time ? ` · ${time}` : ''}
			</p>
		</div>
	);
}
