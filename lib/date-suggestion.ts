// Smart date location engine.
// Given two people's home + work locations, finds the most convenient
// meeting zone and returns a specific venue with geographic reasoning.

export type LatLon = { lat: number; lon: number };

export type LondonArea = {
  name: string;
  coords: LatLon;
  vibe: string;
};

// ~40 central/inner London areas with real coordinates
export const LONDON_AREAS: LondonArea[] = [
  { name: "Aldgate", coords: { lat: 51.5136, lon: -0.0759 }, vibe: "city-edge" },
  { name: "Angel / Islington", coords: { lat: 51.5322, lon: -0.1058 }, vibe: "neighbourhood" },
  { name: "Bank / Monument", coords: { lat: 51.5133, lon: -0.0886 }, vibe: "city" },
  { name: "Barbican", coords: { lat: 51.5197, lon: -0.0954 }, vibe: "arts" },
  { name: "Battersea", coords: { lat: 51.4793, lon: -0.1467 }, vibe: "neighbourhood" },
  { name: "Bermondsey", coords: { lat: 51.4975, lon: -0.0670 }, vibe: "neighbourhood" },
  { name: "Bethnal Green", coords: { lat: 51.5275, lon: -0.0549 }, vibe: "neighbourhood" },
  { name: "Borough", coords: { lat: 51.5016, lon: -0.0924 }, vibe: "food" },
  { name: "Brixton", coords: { lat: 51.4627, lon: -0.1145 }, vibe: "neighbourhood" },
  { name: "Canary Wharf", coords: { lat: 51.5042, lon: -0.0195 }, vibe: "city" },
  { name: "Chelsea / Sloane Square", coords: { lat: 51.4913, lon: -0.1621 }, vibe: "upscale" },
  { name: "Clapham", coords: { lat: 51.4618, lon: -0.1390 }, vibe: "neighbourhood" },
  { name: "Clerkenwell", coords: { lat: 51.5234, lon: -0.1054 }, vibe: "creative" },
  { name: "Covent Garden", coords: { lat: 51.5122, lon: -0.1229 }, vibe: "central" },
  { name: "Dalston", coords: { lat: 51.5477, lon: -0.0751 }, vibe: "neighbourhood" },
  { name: "Elephant & Castle", coords: { lat: 51.4958, lon: -0.1011 }, vibe: "transport" },
  { name: "Exmouth Market", coords: { lat: 51.5232, lon: -0.1089 }, vibe: "food" },
  { name: "Farringdon", coords: { lat: 51.5198, lon: -0.1046 }, vibe: "creative" },
  { name: "Fitzrovia", coords: { lat: 51.5195, lon: -0.1368 }, vibe: "creative" },
  { name: "Hackney / London Fields", coords: { lat: 51.5440, lon: -0.0572 }, vibe: "neighbourhood" },
  { name: "Hackney Wick", coords: { lat: 51.5413, lon: -0.0228 }, vibe: "arts" },
  { name: "Hoxton", coords: { lat: 51.5296, lon: -0.0797 }, vibe: "creative" },
  { name: "King's Cross", coords: { lat: 51.5308, lon: -0.1238 }, vibe: "transport" },
  { name: "London Bridge", coords: { lat: 51.5058, lon: -0.0874 }, vibe: "food" },
  { name: "Marylebone", coords: { lat: 51.5196, lon: -0.1553 }, vibe: "upscale" },
  { name: "Mayfair", coords: { lat: 51.5116, lon: -0.1453 }, vibe: "upscale" },
  { name: "Notting Hill", coords: { lat: 51.5117, lon: -0.1978 }, vibe: "neighbourhood" },
  { name: "Old Street", coords: { lat: 51.5257, lon: -0.0876 }, vibe: "tech" },
  { name: "Peckham", coords: { lat: 51.4738, lon: -0.0694 }, vibe: "neighbourhood" },
  { name: "Pimlico / Victoria", coords: { lat: 51.4944, lon: -0.1447 }, vibe: "transport" },
  { name: "Shoreditch", coords: { lat: 51.5228, lon: -0.0782 }, vibe: "creative" },
  { name: "Soho", coords: { lat: 51.5140, lon: -0.1350 }, vibe: "central" },
  { name: "South Bank", coords: { lat: 51.5055, lon: -0.1132 }, vibe: "arts" },
  { name: "Spitalfields", coords: { lat: 51.5191, lon: -0.0726 }, vibe: "creative" },
  { name: "Stoke Newington", coords: { lat: 51.5607, lon: -0.0733 }, vibe: "neighbourhood" },
  { name: "Stratford", coords: { lat: 51.5423, lon: -0.0021 }, vibe: "transport" },
  { name: "Vauxhall / Nine Elms", coords: { lat: 51.4855, lon: -0.1244 }, vibe: "transport" },
  { name: "Waterloo", coords: { lat: 51.5034, lon: -0.1126 }, vibe: "transport" },
  { name: "Whitechapel", coords: { lat: 51.5194, lon: -0.0605 }, vibe: "neighbourhood" },
  { name: "Wimbledon", coords: { lat: 51.4214, lon: -0.2080 }, vibe: "neighbourhood" },
];

// Venues per area — name, type, address, why it works for a first date
type VenueOption = {
  name: string;
  type: "dinner" | "drinks" | "brunch" | "activity" | "walk" | "lunch";
  address: string;
  tagline: string;
};

const VENUES: Record<string, VenueOption[]> = {
  "Borough": [
    { name: "Hawksmoor Borough", type: "dinner", address: "16 Winchester Walk, SE1", tagline: "Serious food that earns the conversation around it." },
    { name: "Padella", type: "dinner", address: "6 Southwark St, SE1", tagline: "Queue together. Good first test." },
    { name: "Borough Market", type: "brunch", address: "8 Southwark St, SE1", tagline: "No agenda. Good coffee. The best dates don't feel like dates." },
  ],
  "Clerkenwell": [
    { name: "Luca", type: "dinner", address: "88 St John St, EC1M", tagline: "Quiet enough for a real conversation. Good enough to deserve your attention." },
    { name: "The Zetter", type: "drinks", address: "86-88 Clerkenwell Rd, EC1M", tagline: "Low-pressure, good cocktails, easy to leave or stay." },
    { name: "Exmouth Market", type: "lunch", address: "Exmouth Market, EC1R", tagline: "Casual, lively, no wrong order." },
  ],
  "Farringdon": [
    { name: "St. John Bar and Restaurant", type: "dinner", address: "26 St John St, EC1M", tagline: "London institution. Shows you have taste without trying to." },
    { name: "Fabric area walk", type: "walk", address: "77A Charterhouse St, EC1M", tagline: "Clerkenwell is beautiful to walk at dusk." },
  ],
  "Shoreditch": [
    { name: "Lyle's", type: "dinner", address: "Tea Building, 56 Shoreditch High St, E1", tagline: "Short menu, long impression." },
    { name: "The Clove Club", type: "dinner", address: "Shoreditch Town Hall, 380 Old St, EC1V", tagline: "If you're going to spend the evening somewhere, make it count." },
    { name: "Nightjar", type: "drinks", address: "129 City Rd, EC1V", tagline: "Dark, unhurried, the right atmosphere for a first real conversation." },
  ],
  "Old Street": [
    { name: "Caravan Old Street", type: "brunch", address: "11-13 Exmouth Market, EC1R", tagline: "Relaxed, good food, no agenda." },
    { name: "The Hoxton, Shoreditch", type: "drinks", address: "81 Great Eastern St, EC2A", tagline: "Comfortable lobby bar — easy to arrive, easy to stay." },
  ],
  "King's Cross": [
    { name: "Barrafina King's Cross", type: "dinner", address: "Coal Drops Yard, N1C", tagline: "Counter dining makes the conversation easier. No side-by-side awkwardness." },
    { name: "Granary Square", type: "walk", address: "Granary Square, N1C", tagline: "Evening walk along the canal. Good transition to wherever you end up." },
    { name: "German Gymnasium", type: "dinner", address: "1 King's Boulevard, N1C", tagline: "Grand space, feels like an occasion without being fussy." },
  ],
  "Angel / Islington": [
    { name: "Ottolenghi Islington", type: "brunch", address: "287 Upper St, N1", tagline: "Unhurried, beautiful, lets the conversation breathe." },
    { name: "The Almeida", type: "activity", address: "Almeida St, N1", tagline: "Theatre first, dinner after. Shared material from the start." },
    { name: "500 Restaurant", type: "dinner", address: "782 Holloway Rd, N19", tagline: "Proper neighbourhood Italian. Feels like you already know the place." },
  ],
  "South Bank": [
    { name: "Skylon", type: "dinner", address: "Royal Festival Hall, SE1", tagline: "River view, no fuss. Good for anyone coming from either side of the city." },
    { name: "Tate Modern + Blavatnik Building", type: "activity", address: "Bankside, SE1", tagline: "Free, beautiful, gives you something to react to together." },
    { name: "Arabica", type: "lunch", address: "3 Rochester Walk, SE1", tagline: "Levantine sharing plates. Casual, excellent." },
  ],
  "Waterloo": [
    { name: "Coin Laundry", type: "drinks", address: "70 Great Russell St, WC1B", tagline: "Relaxed cocktail bar, not trying too hard." },
    { name: "cut the mustard — Waterloo", type: "brunch", address: "Lower Marsh, SE1", tagline: "Good independent café strip, no pretension." },
  ],
  "Covent Garden": [
    { name: "Rules", type: "dinner", address: "35 Maiden Lane, WC2E", tagline: "London's oldest restaurant. Atmosphere does half the work." },
    { name: "Dishoom Covent Garden", type: "dinner", address: "12 Upper St Martin's Lane, WC2H", tagline: "Queue together, share the table. One of the better first date formats." },
  ],
  "Fitzrovia": [
    { name: "Berners Tavern", type: "dinner", address: "10 Berners St, W1T", tagline: "Spectacular room. Easy conversation starter." },
    { name: "Roka Charlotte St", type: "dinner", address: "37 Charlotte St, W1T", tagline: "Robata and cocktails. High-energy but easy." },
  ],
  "Soho": [
    { name: "Bao Soho", type: "dinner", address: "53 Lexington St, W1F", tagline: "Tiny, excellent, makes you lean in." },
    { name: "Bar Termini", type: "drinks", address: "7 Old Compton St, W1D", tagline: "Three cocktails and you're done. Perfect." },
  ],
  "Hackney / London Fields": [
    { name: "Bistrotheque", type: "dinner", address: "23-27 Wadeson St, E2", tagline: "East London institution. Feels local even if you're not." },
    { name: "London Fields Brewery", type: "drinks", address: "365-366 Warburton St, E8", tagline: "Casual, relaxed, unpretentious." },
  ],
  "Bermondsey": [
    { name: "José", type: "drinks", address: "104 Bermondsey St, SE1", tagline: "Tiny tapas bar. Standing room only. Immediate intimacy." },
    { name: "Zucca", type: "dinner", address: "184 Bermondsey St, SE1", tagline: "Italian, local, excellent. No pressure." },
  ],
  "London Bridge": [
    { name: "Rooftop at Mondrian Shoreditch", type: "drinks", address: "45 Curtain Rd, EC2A", tagline: "City views, easy atmosphere, good first impression." },
    { name: "Pique-Nique", type: "dinner", address: "Tanner St Park, SE1", tagline: "Seasonal French in a park. Memorable." },
  ],
  "Marylebone": [
    { name: "Chiltern Firehouse", type: "dinner", address: "1 Chiltern St, W1U", tagline: "If you want somewhere that makes a statement." },
    { name: "The Golden Hind", type: "lunch", address: "73 Marylebone Ln, W1U", tagline: "No-frills fish and chips. Disarming on a first date." },
  ],
  "Mayfair": [
    { name: "Hide", type: "dinner", address: "85 Piccadilly, W1J", tagline: "Three floors, exceptional everything. Save for when you already know." },
    { name: "Scott's", type: "dinner", address: "20 Mount St, W1K", tagline: "Classic, impressive, the room does the work." },
  ],
  "Battersea": [
    { name: "Fiume", type: "dinner", address: "Circus West Village, SW8", tagline: "Riverside Italian at Battersea Power Station. Good arrival energy." },
    { name: "Lost in Brixton", type: "drinks", address: "Brixton Village, SW9", tagline: "Informal, vibrant, easy to extend the evening." },
  ],
  "Clapham": [
    { name: "The Dairy", type: "dinner", address: "15 The Pavement, SW4", tagline: "Small plates, great cooking, neighbourhood feel." },
    { name: "Bistro Union", type: "brunch", address: "40 Abbeville Rd, SW4", tagline: "Laid back, excellent food, no pressure." },
  ],
  "Peckham": [
    { name: "Levan", type: "dinner", address: "12 Blenheim Grove, SE15", tagline: "Natural wine, beautiful food, the right vibe." },
    { name: "Pedler", type: "brunch", address: "58 Peckham Rye, SE15", tagline: "Neighbourhood favourite. Great if you both live locally." },
  ],
  "Notting Hill": [
    { name: "The Ledbury", type: "dinner", address: "127 Ledbury Rd, W11", tagline: "If you're making an occasion of it." },
    { name: "Books for Cooks", type: "activity", address: "4 Blenheim Crescent, W11", tagline: "Tiny bookshop café. Unusual, memorable." },
  ],
  "Hackney Wick": [
    { name: "Crate Brewery", type: "drinks", address: "Unit 7, Queen's Yard, E9", tagline: "Canalside, casual, genuinely good pizza." },
    { name: "Grow Hackney", type: "activity", address: "Queen's Yard, White Post Lane, E9", tagline: "Events space on the canal. Check what's on." },
  ],
};

// Fallback for areas without specific venues
const DEFAULT_VENUES: VenueOption[] = [
  { name: "Local neighbourhood bar", type: "drinks", address: "Near the midpoint", tagline: "Keep it easy and low-commitment for a first meeting." },
  { name: "Sunday brunch somewhere between you", type: "brunch", address: "Near the midpoint", tagline: "The lowest-pressure format for a first in-person meeting." },
];

// ─── Core engine ──────────────────────────────────────────────────────────────

function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function midpoint(points: LatLon[]): LatLon {
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lon = points.reduce((s, p) => s + p.lon, 0) / points.length;
  return { lat, lon };
}

function nearestArea(point: LatLon): LondonArea {
  return LONDON_AREAS.reduce((best, area) => {
    const d = haversineKm(point, area.coords);
    const bd = haversineKm(point, best.coords);
    return d < bd ? area : best;
  });
}

export type SmartDateSuggestion = {
  meetZone: string;
  venue: VenueOption;
  reasoning: string;
  commuteNote: string;
  distanceFromYou: string;
  distanceFromThem: string;
};

export type PersonLocation = {
  home: string;
  work: string;
};

// Resolve an area name string to its coords (case-insensitive partial match)
function resolveArea(name: string): LatLon | null {
  const lower = name.toLowerCase().trim();
  const match = LONDON_AREAS.find(
    (a) =>
      a.name.toLowerCase().includes(lower) ||
      lower.includes(a.name.toLowerCase().split(" / ")[0].toLowerCase())
  );
  return match?.coords ?? null;
}

function pickVenue(areaName: string): VenueOption {
  // Try exact then partial match
  const key = Object.keys(VENUES).find(
    (k) =>
      areaName.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(areaName.toLowerCase().split(" / ")[0].toLowerCase())
  );
  const list = key ? VENUES[key] : DEFAULT_VENUES;
  // Pick deterministically (first) — could be randomised per session
  return list[0];
}

function kmToMiles(km: number) {
  return (km * 0.621371).toFixed(1);
}

export function computeSmartDate(
  user: PersonLocation,
  match: PersonLocation
): SmartDateSuggestion {
  const userHome = resolveArea(user.home);
  const userWork = resolveArea(user.work);
  const matchHome = resolveArea(match.home);
  const matchWork = resolveArea(match.work);

  const known = [userHome, userWork, matchHome, matchWork].filter(Boolean) as LatLon[];

  if (known.length < 2) {
    // Fallback: not enough location data
    return {
      meetZone: "Somewhere central",
      venue: DEFAULT_VENUES[0],
      reasoning: "Add your home and work location (and theirs) to get a smarter suggestion.",
      commuteNote: "",
      distanceFromYou: "—",
      distanceFromThem: "—",
    };
  }

  // Strategy: weight the midpoint toward work locations if both have them
  // (weekday evening is the most common first-date scenario)
  const weightedPoints: LatLon[] = [];
  if (userWork) { weightedPoints.push(userWork, userWork); } // double-weight work
  if (matchWork) { weightedPoints.push(matchWork, matchWork); }
  if (userHome) { weightedPoints.push(userHome); }
  if (matchHome) { weightedPoints.push(matchHome); }

  const center = midpoint(weightedPoints.length > 0 ? weightedPoints : known);
  const bestArea = nearestArea(center);
  const venue = pickVenue(bestArea.name);

  // Distances from the zone to each person's nearest point
  const userNearest = [userHome, userWork].filter(Boolean) as LatLon[];
  const matchNearest = [matchHome, matchWork].filter(Boolean) as LatLon[];

  const dUser = Math.min(...userNearest.map((p) => haversineKm(p, bestArea.coords)));
  const dMatch = Math.min(...matchNearest.map((p) => haversineKm(p, bestArea.coords)));

  // Build human reasoning string
  const parts: string[] = [];

  if (userWork && matchWork) {
    const workMid = nearestArea(midpoint([userWork, matchWork]));
    parts.push(
      `${bestArea.name} sits between ${user.work} and ${match.work} — easy after-work for both of you`
    );
  } else if (userWork) {
    parts.push(`Close to your office in ${user.work}`);
    if (matchHome) parts.push(`and not far from where ${match.home.split(",")[0]} is`);
  } else if (matchWork) {
    parts.push(`Convenient for them after work in ${match.work}`);
    if (userHome) parts.push(`and a short trip from ${user.home.split(",")[0]}`);
  } else if (userHome && matchHome) {
    parts.push(
      `A fair midpoint between ${user.home.split(",")[0]} and ${match.home.split(",")[0]}`
    );
  }

  const commuteNote = buildCommuteNote(user, match, bestArea.name);

  return {
    meetZone: bestArea.name,
    venue,
    reasoning: parts.join(", ") + ".",
    commuteNote,
    distanceFromYou: `${kmToMiles(dUser)} mi`,
    distanceFromThem: `${kmToMiles(dMatch)} mi`,
  };
}

function buildCommuteNote(
  user: PersonLocation,
  match: PersonLocation,
  zone: string
): string {
  const hasUserWork = user.work.trim().length > 0;
  const hasMatchWork = match.work.trim().length > 0;

  if (hasUserWork && hasMatchWork) {
    return `On a weekday evening, you're both leaving your offices — ${zone} is the natural landing point.`;
  }
  if (hasUserWork) {
    return `You finish work in ${user.work} — ${zone} is on your way and easy for them to reach.`;
  }
  if (hasMatchWork) {
    return `They finish work in ${match.work} — ${zone} saves them a backtrack and isn't far for you.`;
  }
  return `For a weekend afternoon, ${zone} is a comfortable distance for you both.`;
}
