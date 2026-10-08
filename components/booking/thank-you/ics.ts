import { siteConfig } from '@/lib/site-config';
import { windowInstants, type ConfirmedBooking } from './confirmed-booking';

interface IcsEvent {
	uid: string;
	title: string;
	start: number;
	end: number;
	location: string;
	description: string;
}

function stamp(ms: number): string {
	return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function esc(text: string): string {
	return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function vevent(e: IcsEvent, now: number): string[] {
	return [
		'BEGIN:VEVENT',
		`UID:${e.uid}`,
		`DTSTAMP:${stamp(now)}`,
		`DTSTART:${stamp(e.start)}`,
		`DTEND:${stamp(e.end)}`,
		`SUMMARY:${esc(e.title)}`,
		`LOCATION:${esc(e.location)}`,
		`DESCRIPTION:${esc(e.description)}`,
		'END:VEVENT',
	];
}

/** Calendar events for one booking: handover + return for rentals, the journey for chauffeur. */
function eventsFor(b: ConfirmedBooking, orderName: string): IcsEvent[] {
	const garage = siteConfig.contact.address;
	const ref = orderName ? `Booking #${orderName}. ` : '';
	if (b.kind === 'chauffeur') {
		return [
			{
				uid: `${b.id}@noir-drive`,
				title: `${siteConfig.name}: ${b.title}`,
				start: Date.parse(b.from),
				end: Date.parse(b.to),
				location: b.address ?? garage,
				description: `${ref}${b.chauffeur ? `Chauffeur: ${b.chauffeur}. ` : ''}${b.flightNumber ? `Flight ${b.flightNumber}.` : ''}`.trim(),
			},
		];
	}
	const HOUR = 3_600_000;
	const handover = windowInstants(b.fromDate, b.handoverWindow) ?? [Date.parse(b.from) + 10 * HOUR, Date.parse(b.from) + 12 * HOUR];
	const ret = windowInstants(b.toDate, b.returnWindow) ?? [Date.parse(b.to) + 10 * HOUR, Date.parse(b.to) + 12 * HOUR];
	return [
		{
			uid: `${b.id}-handover@noir-drive`,
			title: `${siteConfig.name}: ${b.title} handover`,
			start: handover[0],
			end: handover[1],
			location: b.delivered ? (b.address ?? '') : garage,
			description: `${ref}Have your driving licence to hand. The deposit is held on a card at handover.${b.flightNumber ? ` Flight ${b.flightNumber}.` : ''}`,
		},
		{
			uid: `${b.id}-return@noir-drive`,
			title: `${siteConfig.name}: ${b.title} return`,
			start: ret[0],
			end: ret[1],
			location: b.collectAddress ?? (b.delivered ? (b.address ?? '') : garage),
			description: `${ref}Return of the car.`,
		},
	];
}

/** `data:` URL for an .ics file covering every booking in the order. */
export function icsHref(bookings: readonly ConfirmedBooking[], orderName: string): string {
	const now = Date.now();
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		`PRODID:-//${siteConfig.name}//Booking//EN`,
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		...bookings.flatMap((b) => eventsFor(b, orderName).flatMap((e) => vevent(e, now))),
		'END:VCALENDAR',
	];
	return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`;
}
