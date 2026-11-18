/**
 * "Tours from where" — the three ways into the catalogue the owner asked for
 * on the menu (2026-11-18): from the Falmouth cruise port, from the Montego
 * Bay cruise port, and from hotels. Each is its own page under
 * /tours/from/[slug], so a cruise guest lands straight on prices from their
 * pier instead of first having to find the pier in the hotel picker.
 *
 * `place` is the PLACES key the page sets as the pickup; `null` means the
 * guest picks their own hotel. `drive` is the DRIVE_TABLE group shown on it.
 * Menu order is the owner's.
 */
export const TOUR_ORIGINS = [
  {
    slug: "falmouth-cruise-port",
    place: "falmouth-cruise-pier",
    navKey: "toursFromFalmouth",
    menu: "Tours from Falmouth Cruise Port",
    image: "/local/hero-6.jpg",
    drive: "falmouth-pier",
  },
  {
    slug: "montego-bay-cruise-port",
    place: "mobay-cruise-pier",
    navKey: "toursFromMobay",
    menu: "Tours from Montego Bay Cruise Port",
    image: "/ppp/guests-cruise-port-group.jpg",
    drive: "mobay-pier",
  },
  {
    slug: "hotels",
    place: null,
    navKey: "toursFromHotels",
    menu: "Tours from Hotels",
    image: "/ppp/guests-van-resort.jpg",
    drive: "hotels",
  },
];

export function getTourOrigin(slug) {
  return TOUR_ORIGINS.find((o) => o.slug === slug) ?? null;
}
