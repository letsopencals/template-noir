'use client';

import { memo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { clsx } from 'clsx';
import { DURATION, EASE_IN_OUT, VIEWPORT_ONCE } from '@/components/motion/easing';
import { siteConfig } from '@/lib/site-config';

/* ------------------------------------------------------------------ Data */

/** Zone keys match `siteConfig.deliveryZones[].key`. */
export type MapZoneKey = 'dubai' | 'airport' | 'abu-dhabi-sharjah';

type LabelSide = 'left' | 'right' | 'top' | 'bottom';

export interface MapDestination {
	key: string;
	label: string;
	zone: MapZoneKey;
	/** Marker position in the 1000 × 620 viewBox. */
	x: number;
	y: number;
	side: LabelSide;
	/** Route from the garage (SVG path data, viewBox units). */
	path: string;
	/** Draw a "not to scale" break on long routes. */
	compressed?: boolean;
}

const VIEW_W = 1000;
const VIEW_H = 620;

/** Al Quoz garage. */
const GARAGE = { x: 630, y: 372 } as const;
const FROM = `M${GARAGE.x},${GARAGE.y}`;

/**
 * A stylised, NOT-to-scale Dubai: the coast runs south-west → north-east with
 * the Gulf to the top left. Abu Dhabi is pulled in from ~130 km away.
 */
export const MAP_DESTINATIONS: readonly MapDestination[] = [
	{ key: 'downtown', label: 'Downtown', zone: 'dubai', x: 742, y: 300, side: 'right', path: `${FROM} Q690,318 742,300` },
	{ key: 'palm', label: 'Palm Jumeirah', zone: 'dubai', x: 533, y: 268, side: 'top', path: `${FROM} Q585,292 533,268` },
	{ key: 'marina', label: 'Dubai Marina', zone: 'dubai', x: 488, y: 384, side: 'left', path: `${FROM} Q560,410 488,384` },
	{ key: 'dxb', label: 'DXB', zone: 'airport', x: 902, y: 222, side: 'bottom', path: `${FROM} Q808,262 902,222` },
	{ key: 'sharjah', label: 'Sharjah', zone: 'abu-dhabi-sharjah', x: 962, y: 136, side: 'left', path: `${FROM} Q860,180 962,136` },
	{ key: 'abu-dhabi', label: 'Abu Dhabi', zone: 'abu-dhabi-sharjah', x: 92, y: 566, side: 'right', path: `${FROM} Q340,560 92,566`, compressed: true },
];

/* --------------------------------------------------------------- Geometry */

const COAST =
	'M-10,612 C60,578 150,540 240,500 S380,425 440,392 S520,345 560,322 S690,258 760,222 S850,172 900,146 S980,104 1010,92';
const SEA = `${COAST} L1010,-10 L-10,-10 Z`;
const CREEK = 'M852,170 C864,188 872,206 892,226';
const ROAD_E11 = 'M40,630 C200,560 380,470 560,378 S760,280 850,234 S960,176 1010,150';
const ROAD_E311 = 'M380,630 C520,540 640,470 780,392 S930,300 1010,262';
const PALM_FRONDS = [-24, -34, -44, -54];
/** Tiny offshore "World" islands, purely decorative. */
const ISLANDS = [
	[640, 196], [652, 188], [662, 200], [648, 206], [672, 190], [660, 180], [676, 204], [686, 194],
] as const;

/* ------------------------------------------------------------- Animation */

const DRAW_HIDDEN = { pathLength: 0, opacity: 0 } as const;
const DRAW_VISIBLE = { pathLength: 1, opacity: 1 } as const;
const DRAW_STATIC = { pathLength: 1, opacity: 1 } as const;
const DRAW_TRANSITION = { duration: DURATION.drive + 0.4, ease: EASE_IN_OUT } as const;
const COAST_TRANSITION = { duration: 2.4, ease: EASE_IN_OUT } as const;
const PULSE_ANIMATE = { r: [6, 26], opacity: [0.55, 0] };
const PULSE_TRANSITION = { duration: 2.2, repeat: Infinity, ease: 'easeOut' } as const;
const MARKER_HIDDEN = { scale: 0, opacity: 0 } as const;
const MARKER_VISIBLE = { scale: 1, opacity: 1 } as const;

const LABEL_POS: Record<LabelSide, string> = {
	left: '-translate-x-[calc(100%+14px)] -translate-y-1/2',
	right: 'translate-x-[14px] -translate-y-1/2',
	top: '-translate-x-1/2 -translate-y-[calc(100%+12px)]',
	bottom: '-translate-x-1/2 translate-y-[12px]',
};

/* -------------------------------------------------------------- Component */

export interface DubaiMapProps {
	/** 'routes' (default): animated route lines; 'garage': only the garage pin. */
	variant?: 'routes' | 'garage';
	/** Emphasise one delivery zone and dim the rest. */
	highlight?: MapZoneKey | null;
	/** Hide the HTML labels (e.g. very small renders). */
	hideLabels?: boolean;
	className?: string;
}

/**
 * Hand-built, stylised SVG map of Dubai. Route lines draw from the Al Quoz
 * garage to each delivery point (framer `pathLength`) when the map scrolls
 * into view, then a champagne dot runs along each one. Labels are HTML on
 * top of the SVG so they stay legible at 375 px. Reduced motion: everything
 * is drawn, nothing moves.
 */
export const DubaiMap = memo(function DubaiMap({
	variant = 'routes',
	highlight = null,
	hideLabels = false,
	className,
}: DubaiMapProps) {
	const ref = useRef<HTMLDivElement>(null);
	const inView = useInView(ref, VIEWPORT_ONCE);
	const reduce = useReducedMotion();
	const showRoutes = variant === 'routes';
	const animated = !reduce;

	const isDim = (zone: MapZoneKey) => highlight !== null && highlight !== zone;

	return (
		<div
			ref={ref}
			className={clsx('relative w-full select-none', className)}
			style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
		>
			<svg
				viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
				className="absolute inset-0 h-full w-full"
				role="img"
				aria-label={
					showRoutes
						? `Stylised map of delivery routes from the ${siteConfig.contact.addressShort} garage to ${MAP_DESTINATIONS.map((d) => d.label).join(', ')}`
						: `Stylised map showing the garage in ${siteConfig.contact.addressShort}`
				}
			>
				<defs>
					<pattern id="noir-map-sea" width="10" height="10" patternUnits="userSpaceOnUse">
						<path d="M0,5 H10" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
					</pattern>
					<pattern id="noir-map-land" width="22" height="22" patternUnits="userSpaceOnUse">
						<circle cx="1" cy="1" r="0.9" fill="rgba(255,255,255,0.06)" />
					</pattern>
					<radialGradient id="noir-map-glow" cx="0.63" cy="0.6" r="0.45">
						<stop offset="0%" stopColor="rgba(200,169,107,0.14)" />
						<stop offset="100%" stopColor="rgba(200,169,107,0)" />
					</radialGradient>
				</defs>

				{/* Land texture + glow around the garage */}
				<rect width={VIEW_W} height={VIEW_H} fill="url(#noir-map-land)" />
				<rect width={VIEW_W} height={VIEW_H} fill="url(#noir-map-glow)" />

				{/* Sea */}
				<path d={SEA} fill="#08080A" />
				<path d={SEA} fill="url(#noir-map-sea)" />

				{/* Roads */}
				<path d={ROAD_E11} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="2" />
				<path d={ROAD_E311} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="1 6" strokeLinecap="round" />

				{/* Coastline */}
				<motion.path
					d={COAST}
					fill="none"
					stroke="rgba(200,169,107,0.45)"
					strokeWidth="1.2"
					initial={animated ? DRAW_HIDDEN : DRAW_STATIC}
					animate={animated && inView ? DRAW_VISIBLE : undefined}
					transition={COAST_TRANSITION}
				/>
				<path d={CREEK} fill="none" stroke="rgba(200,169,107,0.35)" strokeWidth="1.2" />

				{/* Palm Jumeirah: trunk, fronds, crescent */}
				<g transform="translate(560 322) rotate(-26.6)" stroke="rgba(200,169,107,0.5)" strokeWidth="1.4" fill="none" strokeLinecap="round">
					<path d="M0,0 V-66" />
					{PALM_FRONDS.map((y) => (
						<path key={y} d={`M0,${y} L-20,${y - 9} M0,${y} L20,${y - 9}`} />
					))}
					<path d="M-40,-50 A42 42 0 1 1 40,-50" />
				</g>

				{ISLANDS.map(([x, y]) => (
					<rect key={`${x}-${y}`} x={x} y={y} width="4" height="3" fill="rgba(200,169,107,0.28)" />
				))}

				{/* Routes */}
				{showRoutes
					? MAP_DESTINATIONS.map((d, i) => {
							const dim = isDim(d.zone);
							return (
								<g key={d.key} className="transition-opacity duration-500" opacity={dim ? 0.18 : 1}>
									<motion.path
										id={`noir-route-${d.key}`}
										d={d.path}
										fill="none"
										stroke="var(--color-primary)"
										strokeWidth={highlight === d.zone ? 2.4 : 1.6}
										strokeLinecap="round"
										initial={animated ? DRAW_HIDDEN : DRAW_STATIC}
										animate={animated && inView ? DRAW_VISIBLE : undefined}
										transition={{ ...DRAW_TRANSITION, delay: 0.6 + i * 0.18 }}
									/>
									{d.compressed ? (
										<g stroke="var(--color-bg)" strokeWidth="5">
											<path d="M340,526 l10,-18 M352,528 l10,-18" />
										</g>
									) : null}
									{d.compressed ? (
										<g stroke="var(--color-primary)" strokeWidth="1.2">
											<path d="M340,526 l10,-18 M352,528 l10,-18" />
										</g>
									) : null}
									{animated && inView ? (
										<circle r="3" fill="var(--color-primary-bright)">
											<animateMotion dur={`${3.4 + i * 0.5}s`} repeatCount="indefinite" path={d.path} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
											<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur={`${3.4 + i * 0.5}s`} repeatCount="indefinite" />
										</circle>
									) : null}
									<motion.g
										style={{ transformOrigin: `${d.x}px ${d.y}px`, transformBox: 'view-box' }}
										initial={animated ? MARKER_HIDDEN : MARKER_VISIBLE}
										animate={animated && inView ? MARKER_VISIBLE : undefined}
										transition={{ duration: DURATION.base, delay: 1.6 + i * 0.18 }}
									>
										<circle cx={d.x} cy={d.y} r="9" fill="var(--color-bg)" stroke="var(--color-primary)" strokeWidth="1.2" />
										<circle cx={d.x} cy={d.y} r="3" fill="var(--color-primary)" />
									</motion.g>
								</g>
							);
						})
					: null}

				{/* Garage */}
				{animated && inView ? (
					<motion.circle cx={GARAGE.x} cy={GARAGE.y} r="6" fill="none" stroke="var(--color-primary)" strokeWidth="1.2" animate={PULSE_ANIMATE} transition={PULSE_TRANSITION} />
				) : null}
				<rect x={GARAGE.x - 8} y={GARAGE.y - 8} width="16" height="16" fill="var(--color-primary)" transform={`rotate(45 ${GARAGE.x} ${GARAGE.y})`} />
				<rect x={GARAGE.x - 3} y={GARAGE.y - 3} width="6" height="6" fill="var(--color-bg)" transform={`rotate(45 ${GARAGE.x} ${GARAGE.y})`} />
			</svg>

			{/* HTML labels (legible at any width) */}
			{hideLabels ? null : (
				<div aria-hidden className="pointer-events-none absolute inset-0">
					<MapLabel x={GARAGE.x} y={GARAGE.y} side="bottom" strong>
						NOIR garage · {siteConfig.contact.addressShort.split(',')[0]}
					</MapLabel>
					{showRoutes
						? MAP_DESTINATIONS.map((d) => (
								<MapLabel key={d.key} x={d.x} y={d.y} side={d.side} dim={isDim(d.zone)}>
									{d.label}
								</MapLabel>
							))
						: null}
					<span className="absolute bottom-2 right-3 text-[0.55rem] uppercase tracking-[0.3em] text-[var(--color-ink-dim)]">
						Not to scale
					</span>
					<span className="absolute left-[6%] top-[12%] text-[0.55rem] uppercase tracking-[0.5em] text-[var(--color-ink-dim)]">
						Arabian Gulf
					</span>
				</div>
			)}
		</div>
	);
});

interface MapLabelProps {
	x: number;
	y: number;
	side: LabelSide;
	dim?: boolean;
	strong?: boolean;
	children: React.ReactNode;
}

function MapLabel({ x, y, side, dim, strong, children }: MapLabelProps) {
	return (
		<span
			className={clsx(
				'absolute whitespace-nowrap text-[0.58rem] font-medium uppercase tracking-[0.2em] transition-opacity duration-500 sm:text-[0.66rem]',
				LABEL_POS[side],
				strong ? 'text-[var(--color-primary-bright)]' : 'text-[var(--color-ink)]',
				dim ? 'opacity-25' : 'opacity-100',
			)}
			style={{ left: `${(x / VIEW_W) * 100}%`, top: `${(y / VIEW_H) * 100}%` }}
		>
			{children}
		</span>
	);
}
