# NOIR Drive image slots

No photography ships with the template. Every image container has the
`.image-placeholder` dark gradient and renders through `SafeImage`, which hides
itself if a file is missing, so the site looks finished without any images.
To add one, drop a file at the exact path below. No code change needed.

Art direction: black or charcoal studio sweep, low-key light, a single champagne
rim light, no plates or people's faces, and no dealer branding.

## Car and chauffeur photos come from your store, not from this folder

Car photos, chauffeur package photos, driver portraits, the logo and the home
hero cover are managed in the Opencals dashboard, not in the template:

| What | Where in the dashboard | Used for |
|---|---|---|
| Product images | Products → a car → Images. The default image is the side profile | Fleet cards, car hero, quick-bar thumbnails, booking pages |
| Further product images | Same list, after the default | The car page "In detail" gallery and lightbox, journal stories, JSON-LD |
| Staff photo | Staff → a chauffeur | Driver picker |
| Banner | Storefront → customisation | Home hero cover (the video poster) and JSON-LD `image` |
| Logo | Storefront → customisation | JSON-LD `logo` (the header wordmark is typographic) |

Add, swap or reorder photos there and the site follows; no deploy needed beyond
cache revalidation. Art direction for car shots: a 16:9 side profile on a black
or charcoal studio sweep as the default, then front three-quarter, cabin and
wheel detail. The `car_rental` seed dataset ships with this set.

## Routes (`/images/routes/`), 2400×1350

jebel-jais.jpg, hatta-dam.jpg, abu-dhabi-corniche.jpg, liwa-dunes.jpg, al-qudra.jpg

## Lifestyle (`/images/lifestyle/`)

| File | Size | Use |
|---|---|---|
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

These are editorial scenes. Package photos are the chauffeur products' own
images in the store.

## Optional video

`/videos/hero.mp4`: a 1920×1080 loop of 8 to 12 s, H.264, muted, ideally under 6 MB.
The home hero falls back to `hero.jpg` (and then to the gradient) when it is missing.
