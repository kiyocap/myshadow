export type Ethnicity =
  | "Black / African"
  | "Black / Caribbean"
  | "Asian / South Asian"
  | "Asian / East Asian"
  | "Asian / South-East Asian"
  | "Mixed / Black & White"
  | "Mixed / Asian & White"
  | "Mixed / Other"
  | "White / British"
  | "White / European"
  | "Latino / Hispanic"
  | "Middle Eastern"
  | "Prefer not to say";

export type Industry =
  | "Architecture & Design"
  | "Arts & Culture"
  | "Finance & Investment"
  | "Healthcare & Medicine"
  | "Law"
  | "Media & Journalism"
  | "Science & Research"
  | "Tech & Product"
  | "Other";

export type NearbyMatch = {
  id: string;
  name: string;
  age: number;
  occupation: string;
  industry: Industry;
  ethnicity: Ethnicity;
  location: string;       // neighbourhood they live in
  workLocation: string;   // neighbourhood they work in
  distanceMiles: number;
  metAt: string;
  score: number;
  tag: string;
  verdict: string;
  greenFlags: string[];
  treadGently: string;
  traits: string[];
  source: "overnight" | "invited";
  // Structured compatibility signals consumed by the Field engine. Optional so
  // older/partial records still type-check; populated for all demo candidates
  // below so the deterministic engine produces meaningful, varied scores.
  relationshipIntent?: string;
  values?: string[];
  emotionalNeeds?: string[];
  ambitionGoals?: string[];
  lifestylePreferences?: string[];
  communicationStyle?: string;
  humourStyle?: string;
  conflictStyle?: string;
  familyChildrenViews?: string;
  datingPatterns?: string[];
};

export const nearbyMatches: NearbyMatch[] = [
  {
    id: "m1",
    name: "Clara",
    age: 29,
    occupation: "Architect",
    industry: "Architecture & Design",
    ethnicity: "White / European",
    location: "Shoreditch",
    workLocation: "Hoxton",
    distanceMiles: 1.2,
    metAt: "2:14 am",
    score: 91,
    tag: "Slow burn, high signal",
    verdict:
      "Two people who take their work seriously and their rest seriously — which is rarer than it sounds. Their shadows found an unusual ease around ambition and conflict.",
    greenFlags: [
      "Both value deliberate recovery, not just hustle",
      "Similar communication pace under pressure"
    ],
    treadGently: "She processes quietly — give her the room she needs",
    traits: ["Measured", "Creative", "Loyal"],
    source: "overnight",
    relationshipIntent: "Looking for a serious, long-term partnership",
    values: ["Craft", "Loyalty", "Steadiness", "Integrity", "Depth"],
    emotionalNeeds: ["Room to process before talking", "Emotional consistency"],
    ambitionGoals: ["Lead her own architectural practice", "Build work that lasts"],
    lifestylePreferences: ["Predictable routines", "Deliberate rest", "Calm, planned evenings"],
    communicationStyle: "Measured and calm — thinks before she responds",
    humourStyle: "Dry and understated",
    conflictStyle: "Processes quietly, then talks it out openly once she's ready",
    familyChildrenViews: "Wants children someday",
    datingPatterns: ["Takes time to open up", "Cautious but committed"]
  },
  {
    id: "m2",
    name: "Olu",
    age: 31,
    occupation: "VC Analyst",
    industry: "Finance & Investment",
    ethnicity: "Black / African",
    location: "Bermondsey",
    workLocation: "Canary Wharf",
    distanceMiles: 2.8,
    metAt: "3:47 am",
    score: 84,
    tag: "High spark, manageable chaos",
    verdict:
      "One of you plans things to death and the other figures it out at the airport. Turns out the shadows found that hilarious rather than exhausting.",
    greenFlags: [
      "Complementary rhythm — one's energy fills the other's gaps",
      "Shared appetite for ideas over small talk"
    ],
    treadGently: "Big-picture thinkers who both hate admin — someone has to book the restaurant",
    traits: ["Sharp", "Enthusiastic", "Forward-thinking"],
    source: "overnight",
    relationshipIntent: "Open to a relationship, happy to take it as it comes",
    values: ["Ambition", "Adventure", "Curiosity", "Growth"],
    emotionalNeeds: ["Intellectual stimulation", "Freedom to be spontaneous"],
    ambitionGoals: ["Make partner at the fund", "Back great founders early"],
    lifestylePreferences: ["Spontaneous plans", "Always on the move", "Restless energy"],
    communicationStyle: "Fast, big-picture and idea-driven",
    humourStyle: "Playful and quick",
    conflictStyle: "Addresses things head-on, sometimes too bluntly",
    familyChildrenViews: "Open to children someday",
    datingPatterns: ["Moves fast", "Goes all in quickly"]
  },
  {
    id: "m3",
    name: "Mira",
    age: 27,
    occupation: "Neuroscience Researcher",
    industry: "Science & Research",
    ethnicity: "Asian / South Asian",
    location: "Bethnal Green",
    workLocation: "King's Cross",
    distanceMiles: 0.9,
    metAt: "1:58 am",
    score: 88,
    tag: "Quietly extraordinary",
    verdict:
      "The kind of compatibility that doesn't announce itself. Their shadows spent a long time on values and almost nothing on goals — usually a sign the basics are already solved.",
    greenFlags: [
      "Depth-first conversationalists",
      "Neither of them needs to win the argument"
    ],
    treadGently: "She has a lot going on she doesn't mention — ask more than you think to",
    traits: ["Precise", "Curious", "Self-contained"],
    source: "overnight",
    relationshipIntent: "Wants something real and long-term",
    values: ["Depth", "Curiosity", "Integrity", "Honesty", "Growth"],
    emotionalNeeds: ["Intellectual closeness", "Independence and her own space"],
    ambitionGoals: ["Publish meaningful research", "Run her own lab"],
    lifestylePreferences: ["Quiet routines", "Structured days", "Calm, focused weekends"],
    communicationStyle: "Thoughtful and precise — chooses words carefully",
    humourStyle: "Dry and subtle",
    conflictStyle: "Talks it out calmly — never argues to win",
    familyChildrenViews: "Wants children someday",
    datingPatterns: ["Self-contained", "Takes time to let people in"]
  },
  {
    id: "m4",
    name: "James",
    age: 33,
    occupation: "Screenwriter",
    industry: "Arts & Culture",
    ethnicity: "Mixed / Black & White",
    location: "Dalston",
    workLocation: "Soho",
    distanceMiles: 1.6,
    metAt: "4:22 am",
    score: 79,
    tag: "Interesting tension",
    verdict:
      "A 79 that feels like a 90 in the right moment and a 60 in the wrong one. Worth a real meeting before you decide. The shadows flagged genuine warmth and a meaningful difference in pacing.",
    greenFlags: [
      "Rare sense of humour alignment",
      "Both described loyalty the same way"
    ],
    treadGently: "He's more romantic than he admits — which can land as inconsistency early on",
    traits: ["Witty", "Dreamy", "Loyal when it counts"],
    source: "overnight",
    relationshipIntent: "Looking for something serious, even if he plays it cool",
    values: ["Creativity", "Loyalty", "Warmth", "Honesty"],
    emotionalNeeds: ["Reassurance", "Emotional closeness"],
    ambitionGoals: ["Write and sell a feature film", "Tell stories that resonate"],
    lifestylePreferences: ["Spontaneous nights out", "Creative chaos", "Late nights"],
    communicationStyle: "Warm and expressive, a little guarded at first",
    humourStyle: "Witty, quick and observational",
    conflictStyle: "Tends to avoid conflict and withdraw before circling back",
    familyChildrenViews: "Wants a family eventually",
    datingPatterns: ["Romantic", "Falls hard fast"]
  },
  {
    id: "m5",
    name: "Priya",
    age: 30,
    occupation: "Product Designer",
    industry: "Tech & Product",
    ethnicity: "Asian / South Asian",
    location: "Hackney Wick",
    workLocation: "Old Street",
    distanceMiles: 2.1,
    metAt: "12:33 am",
    score: 93,
    tag: "Rare match",
    verdict:
      "Their shadows talked for longer than any other pair last night. Flagged by the system as a rare structural match — values, pace, conflict style, and long-term intent all pointing in the same direction.",
    greenFlags: [
      "Identical conflict repair style",
      "Both named quiet reliability as the highest form of care"
    ],
    treadGently: "Very high compatibility can feel like pressure — let it breathe",
    traits: ["Intentional", "Warm", "Quietly ambitious"],
    source: "overnight",
    relationshipIntent: "Wants a committed, long-term partnership",
    values: ["Depth", "Honesty", "Craft", "Loyalty", "Steadiness", "Directness"],
    emotionalNeeds: ["Honesty early", "Emotional consistency"],
    ambitionGoals: ["Build a design practice on her own terms"],
    lifestylePreferences: ["Steady routines", "Intentional weekends", "Calm evenings"],
    communicationStyle: "Direct and warm — says what she means",
    humourStyle: "Dry and observational",
    conflictStyle: "Direct — addresses things openly and repairs calmly",
    familyChildrenViews: "Wants children someday",
    datingPatterns: ["Intentional", "Open and steady"]
  },
  {
    id: "m6",
    name: "Sofia",
    age: 28,
    occupation: "Barrister",
    industry: "Law",
    ethnicity: "White / European",
    location: "Clerkenwell",
    workLocation: "Bank / Monument",
    distanceMiles: 3.4,
    metAt: "2:51 am",
    score: 82,
    tag: "Formidable in the best way",
    verdict:
      "Precise, principled, and surprisingly funny. Her shadow and yours found a comfortable rhythm around disagreement — both argue to understand, not to win.",
    greenFlags: [
      "Debate as foreplay, not warfare",
      "Both hold principles over convenience"
    ],
    treadGently: "She will clock inauthenticity in about four minutes",
    traits: ["Principled", "Precise", "Dry wit"],
    source: "overnight",
    relationshipIntent: "Looking for a serious life partner",
    values: ["Integrity", "Honesty", "Directness", "Depth"],
    emotionalNeeds: ["Intellectual respect", "Honesty without games"],
    ambitionGoals: ["Take silk", "Argue landmark cases"],
    lifestylePreferences: ["Structured weeks", "Planned downtime", "Steady rhythm"],
    communicationStyle: "Direct and precise — loves a good debate",
    humourStyle: "Dry wit",
    conflictStyle: "Direct — confronts issues head-on to understand them",
    familyChildrenViews: "Wants children someday",
    datingPatterns: ["Discerning", "Slow to trust"]
  },
  {
    id: "m7",
    name: "Kwame",
    age: 35,
    occupation: "Documentary Director",
    industry: "Media & Journalism",
    ethnicity: "Black / African",
    location: "Peckham",
    workLocation: "South Bank",
    distanceMiles: 4.1,
    metAt: "3:10 am",
    score: 86,
    tag: "Storyteller energy",
    verdict:
      "He listens the way good directors do — not waiting for his turn, but actually taking things in. The shadows spent the most time on childhood and the least time on career.",
    greenFlags: [
      "Curiosity that runs deeper than surface level",
      "Comfortable with emotional complexity"
    ],
    treadGently: "He carries a lot of things from before — not baggage, but history",
    traits: ["Perceptive", "Warm", "Quietly intense"],
    source: "overnight",
    relationshipIntent: "Open to a relationship with real depth",
    values: ["Curiosity", "Warmth", "Depth", "Creativity"],
    emotionalNeeds: ["Emotional depth", "To feel genuinely heard"],
    ambitionGoals: ["Direct films that matter", "Tell honest stories"],
    lifestylePreferences: ["Slow mornings", "Creative projects", "Calm evenings"],
    communicationStyle: "Warm and a deeply attentive listener",
    humourStyle: "Warm and wry",
    conflictStyle: "Open about feelings — talks things through gently",
    familyChildrenViews: "Wants children someday",
    datingPatterns: ["Takes time", "Guarded until he feels safe"]
  },
  {
    id: "m8",
    name: "Amara",
    age: 26,
    occupation: "Junior Doctor",
    industry: "Healthcare & Medicine",
    ethnicity: "Black / Caribbean",
    location: "Stoke Newington",
    workLocation: "Whitechapel",
    distanceMiles: 1.8,
    metAt: "1:12 am",
    score: 77,
    tag: "High floor, worth the wait",
    verdict:
      "A 77 because her schedule makes the early stages logistically hard — not because the compatibility isn't there. The shadows agreed on almost everything that matters long-term.",
    greenFlags: [
      "Same understanding of what care looks like in practice",
      "Neither of them romanticises busyness"
    ],
    treadGently: "She runs on a different clock — patience isn't optional",
    traits: ["Grounded", "Understated", "Deeply caring"],
    source: "overnight",
    relationshipIntent: "Wants something serious and lasting",
    values: ["Loyalty", "Steadiness", "Warmth", "Integrity", "Depth"],
    emotionalNeeds: ["Patience with her schedule", "Emotional consistency"],
    ambitionGoals: ["Specialise in paediatrics", "Become a consultant"],
    lifestylePreferences: ["Unpredictable shifts", "Always busy", "Craves calm downtime"],
    communicationStyle: "Calm, caring and straightforward",
    humourStyle: "Understated and warm",
    conflictStyle: "Addresses things directly when she has the energy to",
    familyChildrenViews: "Wants children someday",
    datingPatterns: ["Steady", "Reliable once she commits"]
  },
  {
    id: "m9",
    name: "Ren",
    age: 32,
    occupation: "UX Researcher",
    industry: "Tech & Product",
    ethnicity: "Asian / East Asian",
    location: "Angel / Islington",
    workLocation: "Fitzrovia",
    distanceMiles: 2.3,
    metAt: "2:40 am",
    score: 89,
    tag: "The one you didn't expect",
    verdict:
      "On paper, not an obvious match. In conversation, the shadows surprised themselves. The compatibility here is less about shared tastes and more about how each of them thinks.",
    greenFlags: [
      "Both process things out loud in a similar register",
      "Neither needs constant reassurance"
    ],
    treadGently: "Takes a while to feel safe enough to be unguarded — worth the patience",
    traits: ["Analytical", "Generous", "Quietly funny"],
    source: "overnight",
    relationshipIntent: "Open to a relationship, no rush",
    values: ["Curiosity", "Honesty", "Growth", "Independence"],
    emotionalNeeds: ["Independence", "Space to recharge"],
    ambitionGoals: ["Lead research at a product company"],
    lifestylePreferences: ["Independent routines", "Quiet weekends", "Needs his own space"],
    communicationStyle: "Analytical — thinks out loud in a steady register",
    humourStyle: "Quietly funny and deadpan",
    conflictStyle: "Direct but calm — addresses issues openly",
    familyChildrenViews: "Open to children someday",
    datingPatterns: ["Slow to trust", "Takes a while to open up"]
  },
  {
    id: "m10",
    name: "Lucas",
    age: 34,
    occupation: "Emergency Consultant",
    industry: "Healthcare & Medicine",
    ethnicity: "White / European",
    location: "Hackney / London Fields",
    workLocation: "Whitechapel",
    distanceMiles: 1.1,
    metAt: "4:05 am",
    score: 85,
    tag: "Still water, deep current",
    verdict:
      "Calm in the way people are calm when they've seen a lot. The shadows identified a rare shared quality: the ability to be serious about life without being heavy about it.",
    greenFlags: [
      "Equanimity that comes from experience, not avoidance",
      "Same idea of what a good evening looks like"
    ],
    treadGently: "He compartmentalises well — can look like emotional distance early on",
    traits: ["Steady", "Dry", "Dependable"],
    source: "overnight",
    relationshipIntent: "Looking for a serious, settled partnership",
    values: ["Steadiness", "Loyalty", "Integrity", "Depth"],
    emotionalNeeds: ["Calm and stability", "Trust built slowly"],
    ambitionGoals: ["Lead an emergency department"],
    lifestylePreferences: ["Calm routines", "Predictable downtime", "Steady pace"],
    communicationStyle: "Calm, dry and measured",
    humourStyle: "Dry and understated",
    conflictStyle: "Tends to compartmentalise and withdraw under stress",
    familyChildrenViews: "Wants children someday",
    datingPatterns: ["Slow to open up", "Steady and dependable"]
  }
];

export const lastRunAt = "last night at 12:33 am";
export const shadowsInArea = 847;

export const ETHNICITY_OPTIONS: Ethnicity[] = [
  "Black / African",
  "Black / Caribbean",
  "Asian / South Asian",
  "Asian / East Asian",
  "Asian / South-East Asian",
  "Mixed / Black & White",
  "Mixed / Asian & White",
  "Mixed / Other",
  "White / British",
  "White / European",
  "Latino / Hispanic",
  "Middle Eastern",
  "Prefer not to say"
];

export const INDUSTRY_OPTIONS: Industry[] = [
  "Architecture & Design",
  "Arts & Culture",
  "Finance & Investment",
  "Healthcare & Medicine",
  "Law",
  "Media & Journalism",
  "Science & Research",
  "Tech & Product",
  "Other"
];
