# NOIR Drive image slots

No photography ships with the template. Every image container has the
`.image-placeholder` dark gradient and renders through `SafeImage`, which hides
itself if a file is missing, so the site looks finished without any images.
To add one, drop a file at the exact path below. No code change needed.

Art direction: black or charcoal studio sweep, low-key light, a single champagne
rim light, no plates or people's faces, and no dealer branding.

## Fleet (`/images/fleet/`), path pattern from `carImages(slug)` in `lib/site-config.ts`

| File | Size | Use |
|---|---|---|
| `<slug>.jpg` | 2000×1125 (16:9) | Side profile on the sweep. Cards, hero and the store product image |
| `<slug>-front.jpg` | 2000×1125 | Front three-quarter view |
| `<slug>-interior.jpg` | 2000×1500 or 2000×1125 | Cabin |
| `<slug>-wheel.jpg` | 1600×1600 or 1600×2000 | Wheel, brake or badge detail |

Slugs: lamborghini-revuelto, ferrari-purosangue, rolls-royce-cullinan,
rolls-royce-spectre, mclaren-750s, lamborghini-urus-se, ferrari-12cilindri,
bentley-continental-gt, mercedes-amg-g63, porsche-911-turbo-s, aston-martin-db12,
range-rover-sv.

## Routes (`/images/routes/`), 2400×1350

jebel-jais.jpg, hatta-dam.jpg, abu-dhabi-corniche.jpg, liwa-dunes.jpg, al-qudra.jpg

## Lifestyle (`/images/lifestyle/`)

| File | Size | Use |
|---|---|---|
| `hero.jpg` | 2560×1440 | Home hero still, also the poster for the video |
| `garage.jpg` | 2400×1600 | About page and the Al Quoz garage |
| `og.jpg` | 1200×630 | Open Graph and Twitter card |
| `key-handover.jpg` | 1600×2000 or 2400×1600 | Details gallery, how it works, and the sign-in / account side panel |
| `quilted-leather.jpg` | 1600×2000 | Details gallery |
| `carbon-brake.jpg` | 1600×2000 | Details gallery |
| `difc-arrival.jpg` | 2400×1600 | Details gallery |
| `sheikh-zayed-night.jpg` | 2400×1350 | Night-drive band on the home page |

Optional extras generated with the set (not referenced by default, handy for
your own sections): `hero-night.jpg`, `palm-jumeirah-dusk.jpg`,
`atlantis-forecourt.jpg`, `desert-golden-hour.jpg`.

## Chauffeur (`/images/chauffeur/`)

| File | Size | Use |
|---|---|---|
| `porte-cochere.jpg` | 2400×1600 | Chauffeur hero: a chauffeured car under a hotel porte-cochère at night |
| `airport-meet.jpg` | 2400×1600 | Airport meet-and-greet (delivery and chauffeur pages) |
| `rear-cabin.jpg` | 2400×1600 | Chauffeur page detail |

Package images (`chauffeur-airport-transfer.jpg`, `chauffeur-by-the-hour.jpg`,
`chauffeur-evening-in-dubai.jpg`, `chauffeur-day-in-abu-dhabi.jpg`) are copies
of the seed dataset's product images; in the live booking flow product photos
come from your Opencals store.

## Optional video

`/videos/hero.mp4`: a 1920×1080 loop of 8 to 12 s, H.264, muted, ideally under 6 MB.
The home hero falls back to `hero.jpg` (and then to the gradient) when it is missing.
