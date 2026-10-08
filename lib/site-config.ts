/**
 * Site configuration: every brand line, contact detail and piece of editorial
 * copy for NOIR Drive lives here, so the whole template can be rebranded in one
 * place.
 *
 * What is NOT here: cars, prices, photos, add-ons, availability and checkout
 * questions. Those come from the Opencals store through the API (car photos are
 * the product's images in the dashboard). `fleetContent` only adds editorial
 * specs and a tagline on top of each car product, keyed by the product slug.
 * Cars without an entry still render from API data.
 *
 * FOUNDATION FILE: page agents read from it and raise changes, rather than
 * editing it directly.
 */

/* ----------------------------------------------------------------- Types */

export type CarCategory = 'supercars' | 'suvs' | 'grand-tourers';

export interface CarContent {
	category: CarCategory;
	/** One calm line, shown under the model name. */
	tagline: string;
	/** Manufacturer-quoted power, hp. */
	hp: number;
	/** 0–100 km/h, seconds (manufacturer figure). */
	zeroToHundred: number;
	/** Top speed, km/h (manufacturer figure). */
	topSpeed: number;
	seats: number;
	engine: string;
	/** Security deposit held at handover (card pre-authorisation), AED. Never charged online. */
	depositAed: number;
	/** Kilometres included per rental day. */
	kmPerDay: number;
	/** Minimum driver age for this car. */
	minAge: number;
}

export interface DriveRoute {
	slug: string;
	title: string;
	/** Short place line, e.g. "Ras Al Khaimah". */
	region: string;
	/** Round trip from Dubai, km (approximate). */
	distanceKm: number;
	/** Driving time each way, human readable. */
	duration: string;
	/** Car slug from `fleetContent` best suited to the drive. */
	bestIn: string;
	/** When to go. */
	bestTime: string;
	intro: string;
	body: string[];
	image: string;
}

/* ------------------------------------------------------------------ Fleet */

/** Editorial content per car, keyed by the product slug in the store. */
export const fleetContent: Record<string, CarContent> = {
	'lamborghini-revuelto': {
		category: 'supercars',
		tagline: 'The V12 flagship, now with three electric motors alongside it.',
		hp: 1001,
		zeroToHundred: 2.5,
		topSpeed: 350,
		seats: 2,
		engine: '6.5 L V12 plug-in hybrid',
		depositAed: 20000,
		kmPerDay: 200,
		minAge: 30,
	},
	'ferrari-purosangue': {
		category: 'suvs',
		tagline: 'Four doors, four seats and a naturally aspirated V12.',
		hp: 715,
		zeroToHundred: 3.3,
		topSpeed: 310,
		seats: 4,
		engine: '6.5 L naturally aspirated V12',
		depositAed: 15000,
		kmPerDay: 250,
		minAge: 25,
	},
	'rolls-royce-cullinan': {
		category: 'suvs',
		tagline: 'Silent, upright and quietly enormous. The hotel arrival car.',
		hp: 563,
		zeroToHundred: 5.2,
		topSpeed: 250,
		seats: 5,
		engine: '6.75 L twin-turbo V12',
		depositAed: 15000,
		kmPerDay: 250,
		minAge: 25,
	},
	'rolls-royce-spectre': {
		category: 'grand-tourers',
		tagline: 'The first electric Rolls-Royce. A two-door coupé that makes no sound at all.',
		hp: 577,
		zeroToHundred: 4.5,
		topSpeed: 250,
		seats: 4,
		engine: 'Dual-motor electric',
		depositAed: 15000,
		kmPerDay: 250,
		minAge: 25,
	},
	'mclaren-750s': {
		category: 'supercars',
		tagline: 'Light, precise and very fast. Built for the mountain road.',
		hp: 740,
		zeroToHundred: 2.8,
		topSpeed: 332,
		seats: 2,
		engine: '4.0 L twin-turbo V8',
		depositAed: 15000,
		kmPerDay: 200,
		minAge: 30,
	},
	'lamborghini-urus-se': {
		category: 'suvs',
		tagline: 'Supercar pace with room for luggage and three friends.',
		hp: 789,
		zeroToHundred: 3.4,
		topSpeed: 312,
		seats: 5,
		engine: '4.0 L twin-turbo V8 plug-in hybrid',
		depositAed: 12000,
		kmPerDay: 250,
		minAge: 25,
	},
	'ferrari-12cilindri': {
		category: 'grand-tourers',
		tagline: 'A front-engined V12 that revs to 9,500 rpm. Long-distance theatre.',
		hp: 819,
		zeroToHundred: 2.9,
		topSpeed: 340,
		seats: 2,
		engine: '6.5 L naturally aspirated V12',
		depositAed: 20000,
		kmPerDay: 200,
		minAge: 30,
	},
	'bentley-continental-gt': {
		category: 'grand-tourers',
		tagline: 'The grand tourer by definition. Abu Dhabi and back before lunch.',
		hp: 771,
		zeroToHundred: 3.2,
		topSpeed: 335,
		seats: 4,
		engine: '4.0 L twin-turbo V8 plug-in hybrid',
		depositAed: 10000,
		kmPerDay: 250,
		minAge: 25,
	},
	'mercedes-amg-g63': {
		category: 'suvs',
		tagline: 'The shape everyone recognises. Equally at home in DIFC and at Hatta.',
		hp: 577,
		zeroToHundred: 4.4,
		topSpeed: 220,
		seats: 5,
		engine: '4.0 L twin-turbo V8 mild hybrid',
		depositAed: 8000,
		kmPerDay: 250,
		minAge: 25,
	},
	'porsche-911-turbo-s': {
		category: 'supercars',
		tagline: 'The everyday supercar. Four-wheel drive and nothing to prove.',
		hp: 701,
		zeroToHundred: 2.5,
		topSpeed: 322,
		seats: 4,
		engine: '3.6 L twin-turbo flat-six hybrid',
		depositAed: 10000,
		kmPerDay: 250,
		minAge: 25,
	},
	'aston-martin-db12': {
		category: 'grand-tourers',
		tagline: 'British, beautifully finished and properly quick.',
		hp: 671,
		zeroToHundred: 3.6,
		topSpeed: 325,
		seats: 4,
		engine: '4.0 L twin-turbo V8',
		depositAed: 10000,
		kmPerDay: 250,
		minAge: 25,
	},
	'range-rover-sv': {
		category: 'suvs',
		tagline: 'The most composed car in the fleet. Long days, long roads, no fatigue.',
		hp: 606,
		zeroToHundred: 4.5,
		topSpeed: 261,
		seats: 5,
		engine: '4.4 L twin-turbo V8',
		depositAed: 8000,
		kmPerDay: 250,
		minAge: 25,
	},
};

/* ----------------------------------------------------------------- Config */

export const siteConfig = {
	name: 'NOIR Drive',
	tagline: 'Luxury car rental in Dubai',
	description:
		'NOIR Drive rents a small, all-black fleet of supercars, SUVs and grand tourers in Dubai. Book online by the day. We deliver to your hotel, villa or the airport and collect at the end.',
	url: 'https://noir.opencals.com',
	locale: 'en_AE',
	currency: 'AED',
	timezone: 'Asia/Dubai',
	country: 'AE',

	/** Wordmark rendered as {text} + small {accent}. */
	logo: { text: 'NOIR', accent: 'DRIVE' },

	/** Collection slugs in the seeded store. `chauffeur` is excluded from the fleet. */
	collections: {
		supercars: 'supercars',
		suvs: 'suvs',
		grandTourers: 'grand-tourers',
		chauffeur: 'chauffeur',
	},

	/** Display labels for fleet categories (keys match collection slugs). */
	categories: [
		{ slug: 'supercars', label: 'Supercars' },
		{ slug: 'suvs', label: 'SUVs' },
		{ slug: 'grand-tourers', label: 'Grand tourers' },
	] as const,

	/** Location `type` values in the store, used to map Deliver / Collect in the UI. */
	locationTypes: {
		garage: 'physical',
		delivery: 'delivery',
	},

	nav: [
		{ href: '/fleet', label: 'Fleet' },
		{ href: '/rates', label: 'Rates' },
		{ href: '/chauffeur', label: 'Chauffeur' },
		{ href: '/delivery', label: 'Delivery' },
		{ href: '/journal', label: 'Journal' },
	],
	navCta: { href: '/book', label: 'Book a car' },

	/** Extra links shown in the full-screen menu after the main nav. */
	menuSecondary: [
		{ href: '/how-it-works', label: 'How it works' },
		{ href: '/about', label: 'About' },
		{ href: '/contact', label: 'Contact' },
	],

	footerColumns: [
		{
			title: 'Rent',
			links: [
				{ href: '/fleet', label: 'Fleet' },
				{ href: '/rates', label: 'Rates' },
				{ href: '/book', label: 'Book a car' },
			],
		},
		{
			title: 'Service',
			links: [
				{ href: '/chauffeur', label: 'Chauffeur' },
				{ href: '/delivery', label: 'Delivery' },
				{ href: '/how-it-works', label: 'How it works' },
			],
		},
		{
			title: 'Journal',
			links: [
				{ href: '/journal', label: 'All drives' },
				{ href: '/journal/jebel-jais', label: 'Jebel Jais' },
				{ href: '/journal/hatta-dam', label: 'Hatta Dam' },
			],
		},
		{
			title: 'NOIR',
			links: [
				{ href: '/about', label: 'About' },
				{ href: '/contact', label: 'Contact' },
				{ href: '/account', label: 'My bookings' },
			],
		},
	],

	contact: {
		address: 'Warehouse 7, Street 19\nAl Quoz Industrial Area 3, Dubai',
		addressShort: 'Al Quoz, Dubai',
		phone: '+971 4 555 0190',
		whatsapp: '+971 50 555 0190',
		/** wa.me link (digits only). */
		whatsappHref: 'https://wa.me/971505550190',
		email: 'concierge@noirdrive.ae',
		hours: [
			{ label: 'Garage', value: 'Daily, 08:00 – 22:00' },
			{ label: 'Delivery & collection', value: 'Daily, 08:00 – 20:00' },
			{ label: 'WhatsApp concierge', value: 'Daily, 07:00 – 23:00' },
		],
		mapHref: 'https://maps.google.com/?q=Al+Quoz+Industrial+Area+3+Dubai',
		socials: [
			{ label: 'Instagram', href: 'https://instagram.com' },
			{ label: 'YouTube', href: 'https://youtube.com' },
		],
	},

	hero: {
		eyebrow: 'Dubai · Luxury car rental',
		heading: 'Drive\nthe night.',
		body: 'Twelve black cars, delivered to your door anywhere in Dubai. Book by the day, online, in a few minutes.',
		primaryCta: { label: 'Book a car', href: '/book' },
		secondaryCta: { label: 'See the fleet', href: '/fleet' },
		video: '/videos/hero.mp4',
	},

	/** Selectable handover windows. Stored on the appointment as custom attributes. */
	handoverTimes: [
		'08:00–10:00',
		'10:00–12:00',
		'12:00–14:00',
		'14:00–16:00',
		'16:00–18:00',
		'18:00–20:00',
	],

	/** Appointment custom-attribute keys written by the booking flow. */
	customAttributeKeys: {
		handoverTime: 'handover_time',
		returnTime: 'return_time',
		collectAddress: 'collect_address',
		flightNumber: 'flight_number',
		preferredCar: 'preferred_car',
	},

	deliveryZones: [
		{
			key: 'dubai',
			name: 'Dubai',
			areas: ['Downtown', 'DIFC', 'Business Bay', 'Dubai Marina', 'JBR', 'Palm Jumeirah', 'Jumeirah', 'Dubai Hills', 'Emirates Hills'],
			fee: 'Included',
			note: 'Delivery and collection anywhere within Dubai are part of the daily rate.',
		},
		{
			key: 'airport',
			name: 'Airports',
			areas: ['DXB Terminals 1, 2 and 3', 'DWC Al Maktoum'],
			fee: 'Included',
			note: 'We meet you in arrivals with the car parked outside. Add your flight number and we track delays.',
		},
		{
			key: 'abu-dhabi-sharjah',
			name: 'Abu Dhabi & Sharjah',
			areas: ['Abu Dhabi city', 'Saadiyat', 'Yas Island', 'Sharjah city'],
			fee: 'Fixed fee, added as an extra',
			note: 'Choose the Abu Dhabi / Sharjah delivery extra when you book. Collection is included.',
		},
	],

	requirements: [
		{
			title: 'Age 25 or over',
			body: 'Most cars need a driver aged 25 or over. A few of the supercars need 30 or over. The minimum is listed on each car.',
		},
		{
			title: 'Licence held for 2 years',
			body: 'A full driving licence, held for at least two years. UAE residents use their UAE licence.',
		},
		{
			title: 'International Driving Permit, where needed',
			body: 'Visitors from the GCC, US, UK, EU and several other countries can drive on their home licence. Others need an IDP alongside it. We check this when you upload your licence.',
		},
		{
			title: 'Passport or Emirates ID',
			body: 'Visitors upload a passport with the entry stamp. Residents upload their Emirates ID, front and back.',
		},
		{
			title: 'Security deposit at handover',
			body: 'A refundable deposit is held on a credit card when we hand over the keys. It is never charged online. The amount is listed on each car and released after the car is returned and fines are checked.',
		},
	],

	howItWorks: [
		{
			index: '01',
			title: 'Book online',
			body: 'Choose a car and your dates, add any extras and upload your licence. You pay the rental online; nothing else is due until handover.',
		},
		{
			index: '02',
			title: 'We deliver',
			body: 'A NOIR driver brings the car to your hotel, villa or the airport in the window you picked. We walk you through the car and hold the deposit.',
		},
		{
			index: '03',
			title: 'We collect',
			body: 'At the end, we collect from wherever you are. Fuel, tolls and fines are settled at cost and the deposit is released.',
		},
	],

	included: [
		'Comprehensive insurance with a set excess',
		'Delivery and collection within Dubai',
		'Kilometres per day as listed on each car',
		'24-hour roadside assistance',
		'A full tank at handover',
	],
	notIncluded: [
		'Fuel used during the rental (or choose prepaid fuel)',
		'Salik tolls and traffic fines, charged at cost',
		'Kilometres beyond the daily allowance',
		'Driving outside the UAE or off tarmac',
	],

	chauffeur: {
		eyebrow: 'Chauffeur',
		heading: 'Be driven.',
		body: 'Some days are better spent in the back seat. Our chauffeurs know the city, the hotels and the quiet entrances, and they drive our own cars.',
		points: [
			'Airport transfers with meet-and-greet in arrivals',
			'By the hour, for meetings and dinners',
			'An evening in Dubai, or a full day in Abu Dhabi',
			'Ask for a preferred car. We confirm it with you before the booking.',
		],
		note: 'A preferred car is a request, not a reservation. If it is out on rental, we offer the closest match before the day.',
		image: '/images/chauffeur/porte-cochere.jpg',
	},

	testimonials: [
		{
			quote: 'The Cullinan was waiting outside arrivals with our names on a card. Collection at the hotel a week later took five minutes.',
			name: 'Sofia R.',
			context: 'Cullinan, 7 days',
		},
		{
			quote: 'I booked the 911 at midnight and had it at the villa by ten the next morning. No calls, no surprises on the bill.',
			name: 'James H.',
			context: '911 Turbo S, 3 days',
		},
		{
			quote: 'They talked me through the Jebel Jais road before I left and checked in on WhatsApp once I was back down. A properly run business.',
			name: 'Karim A.',
			context: 'McLaren 750S, 2 days',
		},
		{
			quote: 'Clear deposit, clear terms, spotless car. We used the chauffeur for a day in Abu Dhabi on the same trip.',
			name: 'Elena M.',
			context: 'Range Rover SV and chauffeur',
		},
	],

	faqs: [
		{
			question: 'How is the price calculated?',
			answer: 'The daily rate multiplied by the number of days, from your pick-up date to your return date. Extras are added on top, either per day or once. You see the full total before you pay.',
		},
		{
			question: 'When is the deposit taken?',
			answer: 'Only at handover, as a hold on a credit card. It is never charged online. The amount depends on the car and is released after the car is returned and Salik and fines have been checked, usually within 14 days.',
		},
		{
			question: 'Who can drive?',
			answer: 'Drivers aged 25 or over (30 for some supercars) with a full licence held for at least two years. Visitors from some countries also need an International Driving Permit. You can add a second driver as an extra.',
		},
		{
			question: 'Where do you deliver?',
			answer: 'Anywhere in Dubai and at both airports, at no extra cost. Abu Dhabi and Sharjah are available as a fixed-fee extra. Or collect the car yourself from our garage in Al Quoz.',
		},
		{
			question: 'What about insurance?',
			answer: 'Every rental includes comprehensive insurance with a set excess. The excess waiver extra reduces that excess to zero for the days you add it.',
		},
		{
			question: 'How many kilometres are included?',
			answer: 'Between 200 and 250 km per day depending on the car, shown on each car page. Extra kilometres are charged at a per-km rate, or you can add the +250 km pack when you book.',
		},
		{
			question: 'Can I drive to Oman or into the desert?',
			answer: 'No. Our cars stay in the UAE and on tarmac. The drives in our Journal, including Liwa, are all on paved roads.',
		},
		{
			question: 'Can I change or cancel?',
			answer: 'Yes, from your account, within the cancellation window shown at checkout. For anything closer to the date, message the concierge on WhatsApp.',
		},
	],

	routes: [
		{
			slug: 'jebel-jais',
			title: 'Jebel Jais',
			region: 'Ras Al Khaimah',
			distanceKm: 300,
			duration: '1 h 30 min each way',
			bestIn: 'mclaren-750s',
			bestTime: 'Leave Dubai at dawn, back by midday',
			intro: 'The highest road in the UAE, climbing through the Hajar mountains in a long chain of switchbacks.',
			body: [
				'Take the E311 north out of Dubai and pick up the E18 towards Ras Al Khaimah. The plains are flat and quick, and the mountains appear on the horizon long before you reach them.',
				'The mountain road itself is about 30 km of smooth, wide tarmac with barriers on the outside of every bend. It climbs well above 1,000 m, and the air is noticeably cooler at the top.',
				'Go early. The road is quiet at sunrise and the light on the ridges is at its best. There is fuel at the base and a café at the summit, but nothing in between.',
			],
			image: '/images/routes/jebel-jais.jpg',
		},
		{
			slug: 'hatta-dam',
			title: 'Hatta Dam',
			region: 'Hatta, Dubai',
			distanceKm: 270,
			duration: '1 h 30 min each way',
			bestIn: 'mercedes-amg-g63',
			bestTime: 'Late afternoon, back after sunset',
			intro: 'Dubai’s mountain enclave, reached by a road that turns from desert to rock in an hour.',
			body: [
				'Head east on the E44 past Al Awir. After Madam the dunes turn red, and then the road starts climbing into the Hajar foothills towards Hatta.',
				'At the dam, the turquoise water sits between bare rock walls. Park at the top, walk the steps down to the edge and take in the view of the reservoir.',
				'Our cars must stay in the UAE, so keep to the main Dubai–Hatta road and avoid any turn-off signed for Oman.',
			],
			image: '/images/routes/hatta-dam.jpg',
		},
		{
			slug: 'abu-dhabi-corniche',
			title: 'Abu Dhabi Corniche',
			region: 'Abu Dhabi',
			distanceKm: 300,
			duration: '1 h 40 min each way',
			bestIn: 'rolls-royce-spectre',
			bestTime: 'Evening, for the city lights on the water',
			intro: 'A long, effortless motorway run to the capital, ending on its eight-kilometre waterfront.',
			body: [
				'Follow Sheikh Zayed Road south until it becomes the E11. It is wide, smooth and straight, which suits a quiet car best.',
				'Come in over the Sheikh Zayed Bridge, pass the Grand Mosque and follow the coast road to the Corniche. The lights come on along the water just after sunset.',
				'Speed cameras on the E11 are frequent and the limits change between emirates. Fines are passed on at cost, so set the cruise control and enjoy the ride.',
			],
			image: '/images/routes/abu-dhabi-corniche.jpg',
		},
		{
			slug: 'liwa-dunes',
			title: 'Liwa',
			region: 'Al Dhafra, Abu Dhabi',
			distanceKm: 740,
			duration: '3 h 45 min each way',
			bestIn: 'range-rover-sv',
			bestTime: 'An overnight trip, in the cooler months',
			intro: 'The edge of the Empty Quarter, where the dunes are the tallest in the country.',
			body: [
				'This is a long day, so most guests stay overnight. Drive the E11 towards Abu Dhabi, then turn inland on the E45 through Madinat Zayed to the Liwa crescent.',
				'The paved road to Moreeb Dune runs between sand walls that rise well over a hundred metres. Stop at the base and watch the light change across the slope.',
				'Stay on the tarmac. Our cars are not insured for sand, and the paved roads already take you right into the dunes.',
			],
			image: '/images/routes/liwa-dunes.jpg',
		},
		{
			slug: 'al-qudra',
			title: 'Al Qudra',
			region: 'Dubai desert',
			distanceKm: 100,
			duration: '45 min each way',
			bestIn: 'bentley-continental-gt',
			bestTime: 'Sunrise or the hour before sunset',
			intro: 'A short escape from the city to the lakes and open desert south of Dubai.',
			body: [
				'Take Al Qudra Road from the E611 and the city disappears quickly behind you. The road is straight and empty, with dunes on both sides.',
				'Park near the lakes to see the birdlife at first light, or wait for sunset when the sand turns orange.',
				'Look out for camels near the road and cyclists on the track alongside it. It makes an easy morning drive before breakfast.',
			],
			image: '/images/routes/al-qudra.jpg',
		},
	] satisfies DriveRoute[],

	about: {
		eyebrow: 'About NOIR',
		heading: 'A small fleet,\nlooked after properly.',
		body: [
			'NOIR Drive is a Dubai rental garage with a deliberately short list of cars. Every one is black, recent and maintained in-house in Al Quoz.',
			'We keep the fleet small so each car is cleaned, checked and fuelled by the same team that delivers it to you. You book online, see the full price before paying, and deal with one concierge from first message to collection.',
		],
		image: '/images/lifestyle/garage.jpg',
	},

	/**
	 * Marketing-page copy (home sections, how it works, delivery, journal,
	 * contact). Only restates facts found elsewhere in this file.
	 */
	marketing: {
		quickBar: {
			eyebrow: 'Quick booking',
			anyCar: 'Any car',
			modes: [
				{ key: 'delivery', label: 'Deliver to me' },
				{ key: 'garage', label: 'Collect at garage' },
			],
			cta: 'Check dates',
		},
		fleetCarousel: {
			eyebrow: 'The fleet',
			heading: 'Twelve cars.\nAll black.',
			cta: { label: 'See the whole fleet', href: '/fleet' },
		},
		spotlight: {
			slug: 'rolls-royce-cullinan',
			name: 'Cullinan',
			fullName: 'Rolls-Royce Cullinan',
			eyebrow: 'In the spotlight',
			cta: 'Discover the Cullinan',
		},
		howItWorks: {
			eyebrow: 'How it works',
			heading: 'Three steps.\nNo counter.',
			image: '/images/lifestyle/key-handover.jpg',
			cta: { label: 'The full process', href: '/how-it-works' },
		},
		deliveryBand: {
			eyebrow: 'Delivery',
			heading: 'We bring it\nto you.',
			body: 'Delivery and collection anywhere in Dubai and at both airports are part of the daily rate. Abu Dhabi and Sharjah are a fixed-fee extra. Or collect the car yourself from the garage in Al Quoz.',
			cta: { label: 'Zones and handover times', href: '/delivery' },
		},
		details: {
			eyebrow: 'Details',
			heading: 'Looked after\nproperly.',
			body: 'Every car is black, recent and maintained in-house in Al Quoz, then cleaned, checked and fuelled by the same team that delivers it to you.',
			images: [
				{ src: '/images/lifestyle/quilted-leather.jpg', label: 'Quilted leather' },
				{ src: '/images/lifestyle/carbon-brake.jpg', label: 'Brakes and wheels' },
				{ src: '/images/lifestyle/key-handover.jpg', label: 'The handover' },
				{ src: '/images/lifestyle/difc-arrival.jpg', label: 'Arrival, DIFC' },
			],
		},
		journalTeaser: {
			eyebrow: 'Journal',
			heading: 'Five drives\nfrom Dubai.',
			body: 'Mountain roads, the capital and the edge of the Empty Quarter, all on tarmac, with the car we would take on each.',
			cta: { label: 'All drives', href: '/journal' },
		},
		testimonialsEyebrow: 'Guests',
		faqEyebrow: 'Questions',
		finalCta: {
			eyebrow: 'Ready when you are',
			heading: 'Pick a car.\nWe bring it.',
			body: 'Book online in a few minutes, or message the concierge on WhatsApp.',
			image: '/images/lifestyle/sheikh-zayed-night.jpg',
		},
		deposit: {
			heading: 'The deposit, explained',
			steps: [
				{ title: 'At handover', body: 'A refundable hold is placed on a credit card when we hand over the keys. The amount is listed on each car.' },
				{ title: 'Never online', body: 'Nothing related to the deposit is charged when you book. You only pay the rental online.' },
				{ title: 'After return', body: 'Once the car is back and Salik and fines have been checked, the hold is released, usually within 14 days.' },
			],
		},
		cancellation: {
			heading: 'Changes and cancellation',
			points: [
				'Change or cancel from your account, within the cancellation window shown at checkout.',
				'For anything closer to the date, message the concierge on WhatsApp.',
				'The deposit is only held at handover, so there is nothing to release if you cancel before then.',
			],
		},
		delivery: {
			airport: {
				eyebrow: 'Airports',
				heading: 'Met in\narrivals.',
				image: '/images/chauffeur/airport-meet.jpg',
			},
			handover: {
				eyebrow: 'Handover windows',
				heading: 'Pick a\ntwo-hour window.',
				body: 'Choose a window for the handover and another for the return when you book. A NOIR driver arrives within it, walks you through the car and holds the deposit.',
			},
			garage: {
				eyebrow: 'Or collect it yourself',
				heading: 'The garage,\nAl Quoz.',
				image: '/images/lifestyle/garage.jpg',
			},
		},
		contact: {
			eyebrow: 'Contact',
			heading: 'Talk to the\nconcierge.',
			intro: 'WhatsApp is the fastest way to reach us. Every booking has one concierge, from first message to collection.',
		},
	},

	legal: {
		company: 'NOIR Drive',
		builtWith: { label: 'Built with Opencals', href: 'https://opencals.com' },
	},
};

export type SiteConfig = typeof siteConfig;
