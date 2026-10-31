import { avatarFromSeed } from "@/components/Avatar";

// Featured community members. Publicly they appear with an illustrated avatar;
// portraits are used only as sample faces to scan and as cropped skin-patch proof.
// Stats come from the same seeded outcome model as the rest of the sample cohort.
export interface Person {
  id: string;
  name: string;
  age: number;
  city: string;
  archetype: "oily-breakout" | "dry-sensitive" | "combination" | "mature" | "balanced";
  tone: string; // placeholder avatar colour until the portrait loads
  about: string;
  goal: string;
  photoPrompt: string;
}

export const PEOPLE: Person[] = [
  { id: "amara", name: "Amara", age: 24, city: "London", archetype: "oily-breakout", tone: "#8d5a3c", about: "Shiny by noon, breakouts along my jaw since uni.", goal: "Fewer breakouts without drying out", photoPrompt: "24 year old Black British woman, deep brown skin with visible oily T-zone shine and a few small jawline blemishes, natural hair pulled back" },
  { id: "diego", name: "Diego", age: 27, city: "Mexico City", archetype: "oily-breakout", tone: "#b07a52", about: "Big pores on my nose and constant shine.", goal: "Matte skin that lasts the day", photoPrompt: "27 year old Mexican man, warm tan skin with visible pores on nose and slight oily shine, short dark hair, clean shaven" },
  { id: "priya", name: "Priya", age: 22, city: "Toronto", archetype: "oily-breakout", tone: "#a8714a", about: "Hormonal breakouts and dark marks that linger.", goal: "Clear skin and faded marks", photoPrompt: "22 year old South Asian Canadian woman, medium brown skin with a few active blemishes and faint post-acne marks on cheeks, long dark hair tied back" },
  { id: "jordan", name: "Jordan", age: 19, city: "Atlanta", archetype: "oily-breakout", tone: "#6e4630", about: "First proper routine. Forehead acne is the worst.", goal: "Figure out what actually works", photoPrompt: "19 year old Black American young man, dark brown skin with some forehead acne, short twists hairstyle" },
  { id: "lena", name: "Lena", age: 31, city: "Berlin", archetype: "dry-sensitive", tone: "#e9c4a8", about: "Tight, flaky cheeks and redness when it's cold.", goal: "Calm, comfortable skin", photoPrompt: "31 year old German woman, fair skin with visible redness on cheeks and slight dryness, light brown hair in a low bun, no makeup" },
  { id: "hannah", name: "Hannah", age: 36, city: "Dublin", archetype: "dry-sensitive", tone: "#f0d2bf", about: "Rosacea-prone. Most actives sting.", goal: "Less flushing, nothing that burns", photoPrompt: "36 year old Irish woman, very fair skin with freckles and redness across nose and cheeks, auburn hair pulled back" },
  { id: "yuki", name: "Yuki", age: 29, city: "Osaka", archetype: "dry-sensitive", tone: "#e6c3a3", about: "Dehydrated skin that reacts to fragrance.", goal: "Hydration that doesn't irritate", photoPrompt: "29 year old Japanese woman, light skin that looks slightly dehydrated with mild redness, black hair tucked behind ears" },
  { id: "sofia", name: "Sofia", age: 41, city: "Madrid", archetype: "dry-sensitive", tone: "#d9a982", about: "Dryness got worse after 40. Barrier feels fragile.", goal: "A stronger skin barrier", photoPrompt: "41 year old Spanish woman, olive skin with dry patches and slight redness, dark wavy hair pulled back" },
  { id: "mei", name: "Mei", age: 26, city: "Singapore", archetype: "combination", tone: "#d9a982", about: "Oily T-zone, dry cheeks. Humidity doesn't help.", goal: "Balanced skin in one routine", photoPrompt: "26 year old Chinese Singaporean woman, light-medium skin with oily forehead and nose but matte cheeks, black hair in a ponytail" },
  { id: "leila", name: "Leila", age: 30, city: "Dubai", archetype: "combination", tone: "#c18e66", about: "Uneven texture and the odd breakout.", goal: "Smoother, more even skin", photoPrompt: "30 year old Emirati-Lebanese woman, medium olive skin with slightly uneven texture, dark hair pulled back" },
  { id: "chloe", name: "Chloe", age: 23, city: "Paris", archetype: "combination", tone: "#efcfb4", about: "Clogged pores on my nose, dry around the mouth.", goal: "Refined pores", photoPrompt: "23 year old French woman, fair skin with visible pores on nose and slight dryness around mouth, blonde hair in a clip" },
  { id: "marcus", name: "Marcus", age: 33, city: "Chicago", archetype: "combination", tone: "#7a4b33", about: "Razor bumps and an oily forehead.", goal: "Clearer, calmer skin", photoPrompt: "33 year old Black American man, brown skin with slight oiliness on forehead and a few razor bumps, short fade haircut, light stubble" },
  { id: "rosa", name: "Rosa", age: 52, city: "Lisbon", archetype: "mature", tone: "#b98463", about: "Fine lines and my skin looks tired.", goal: "Bring back some glow", photoPrompt: "52 year old Portuguese woman, olive skin with fine lines around eyes and some dullness, grey-streaked dark hair pulled back" },
  { id: "grace", name: "Grace", age: 58, city: "Sydney", archetype: "mature", tone: "#efcfb4", about: "Sun spots from years outdoors.", goal: "Even tone and firmer skin", photoPrompt: "58 year old Australian woman, fair skin with sun spots and wrinkles, short silver hair" },
  { id: "nadia", name: "Nadia", age: 47, city: "Cairo", archetype: "mature", tone: "#b07a52", about: "Lines are deepening and texture is rough.", goal: "Smoother texture", photoPrompt: "47 year old Egyptian woman, medium brown skin with forehead lines and slightly rough texture, dark hair under a loosely draped scarf" },
  { id: "elaine", name: "Elaine", age: 61, city: "Vancouver", archetype: "mature", tone: "#e0b89a", about: "Thinner, drier skin than it used to be.", goal: "Comfort and a little radiance", photoPrompt: "61 year old Chinese Canadian woman, light skin with fine wrinkles and mild dryness, short grey hair" },
];

export const personById = (id: string) => PEOPLE.find((p) => p.id === id);

// Public letter avatar for a community member.
export function personAvatar(id: string) {
  return avatarFromSeed(id, personById(id)?.name ?? "");
}

export const portraitPath = (id: string) => `/people/${id}.jpg`;
// The same person photographed eight weeks later (AI-generated sample people).
export const afterPath = (id: string) => `/people/${id}-after.jpg`;
// Sample people whose week-8 photo exists.
export const HAS_AFTER = new Set<string>(["elaine"]);

// Members whose sample photo exists, so their reviews can show skin-patch proof.
export const HAS_PORTRAIT = new Set(["amara", "diego", "priya", "jordan", "lena", "hannah", "yuki", "sofia", "mei", "leila", "chloe", "marcus", "rosa", "grace", "nadia", "elaine"]);

export const PHOTO_STYLE =
  "Photorealistic head-and-shoulders portrait, front-facing, neutral expression, mouth closed, eyes open, forehead visible, even soft daylight, plain warm light pink-beige studio background, no makeup, natural unretouched skin texture, sharp focus, 4:5 portrait framing.";
