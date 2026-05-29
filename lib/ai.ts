import { z } from "zod";

import { getOpenAI, openAIModel } from "@/lib/openai";

export const proxyInputSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(18).max(120).optional(),
  occupation: z.string().optional(),
  location: z.string().optional(),
  starSign: z.string().optional(),
  myersBriggs: z.string().optional(),
  motivation: z.string().min(20),
  frustrations: z.string().min(20),
  goals: z.string().min(20),
  lookingFor: z.string().min(20),
  greatRelationship: z.string().min(20),
  imports: z
    .array(
      z.object({
        type: z.enum([
          "CHATGPT_EXPORT",
          "WHATSAPP_EXPORT",
          "JOURNAL_ENTRY",
          "SOCIAL_PROFILE"
        ]),
        text: z.string()
      })
    )
    .optional()
});

export type ProxyInput = z.infer<typeof proxyInputSchema>;

export type GeneratedProxyProfile = {
  values: string[];
  traits: string[];
  goals: string[];
  communicationStyle: string;
  humourStyle: string;
  strengths: string[];
  weaknesses: string[];
  relationshipPreferences: string[];
  summary: string;
};

const generatedProxyProfileSchema = z.object({
  values: z.array(z.string()).min(1),
  traits: z.array(z.string()).min(1),
  goals: z.array(z.string()).min(1),
  communicationStyle: z.string().min(1),
  humourStyle: z.string().min(1),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  relationshipPreferences: z.array(z.string()).min(1),
  summary: z.string().min(1)
});

export type CompatibilityReportData = {
  overallScore: number;
  communication: number;
  lifestyle: number;
  values: number;
  ambition: number;
  conflictResolution: number;
  greenFlags: string[];
  potentialFriction: string[];
  questionsToDiscuss: string[];
  suggestedFirstDate: string;
  suggestedFirstDates: Array<{
    title: string;
    setting: string;
    bestFor: string;
    whyItFits: string;
    whatToNotice: string;
    logistics: string;
    conversationPrompts: string[];
  }>;
  relationshipOutlook: string;
  shareCardText: string;
};

export type ProxyRepresentative = GeneratedProxyProfile & {
  name: string;
  age?: number;
  occupation?: string;
  location?: string;
  starSign?: string;
  myersBriggs?: string;
};

export type MeetingTranscriptMessage = {
  speakerName: string;
  topic: (typeof meetingTopics)[number];
  content: string;
  turn: number;
};

export type AIMeetingResult = {
  id: string;
  status: "COMPLETED" | "DEMO";
  currentTopic: (typeof meetingTopics)[number];
  participants: {
    proxyA: ProxyRepresentative;
    proxyB: ProxyRepresentative;
  };
  transcript: MeetingTranscriptMessage[];
  report: CompatibilityReportData;
  source: "openai" | "demo";
};

export const meetingTopics = [
  "Identity",
  "Values",
  "Lifestyle",
  "Money",
  "Family",
  "Communication",
  "Conflict",
  "Ambition",
  "Long-Term Goals"
] as const;

function normalizeMeetingTopic(topic: unknown) {
  if (typeof topic !== "string") {
    return "Identity";
  }

  const compactTopic = topic.toLowerCase().replace(/[\s_-]/g, "");
  const topicAliases: Array<[needle: string, topic: (typeof meetingTopics)[number]]> = [
    ["identity", "Identity"],
    ["value", "Values"],
    ["lifestyle", "Lifestyle"],
    ["finance", "Money"],
    ["money", "Money"],
    ["family", "Family"],
    ["communication", "Communication"],
    ["conflict", "Conflict"],
    ["repair", "Conflict"],
    ["ambition", "Ambition"],
    ["career", "Ambition"],
    ["longterm", "Long-Term Goals"],
    ["future", "Long-Term Goals"],
    ["goal", "Long-Term Goals"]
  ];
  const aliasedTopic = topicAliases.find(([needle]) =>
    compactTopic.includes(needle)
  )?.[1];

  if (aliasedTopic) {
    return aliasedTopic;
  }

  const matchedTopic = meetingTopics.find(
    (meetingTopic) =>
      meetingTopic.toLowerCase().replace(/[\s_-]/g, "") === compactTopic
  );

  return matchedTopic ?? topic;
}

const meetingTopicSchema = z
  .preprocess(normalizeMeetingTopic, z.string())
  .transform((topic): (typeof meetingTopics)[number] => {
    const matchedTopic = meetingTopics.find((meetingTopic) => meetingTopic === topic);

    return matchedTopic ?? "Identity";
  });

const meetingMessageSchema = z.object({
  speakerName: z.string(),
  topic: meetingTopicSchema,
  content: z.string().min(1),
  turn: z.coerce.number().int().min(0).optional()
});

const scoreValueSchema = z
  .number()
  .min(0)
  .max(100)
  .transform((score) => {
    if (score > 0 && score <= 1) {
      return Math.round(score * 100);
    }

    if (score > 1 && score <= 10) {
      return Math.round(score * 10);
    }

    return Math.round(score);
  });

const scoreSchema = z.preprocess((value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number.parseFloat(value.replace("%", ""));

    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  return undefined;
}, scoreValueSchema.optional());
const firstDateOptionSchema = z.object({
  title: z.string(),
  setting: z.string(),
  bestFor: z.string(),
  whyItFits: z.string(),
  whatToNotice: z.string(),
  logistics: z.string(),
  conversationPrompts: z.array(z.string()).min(1)
});
const textArraySchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|;|\d+\./)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}, z.array(z.string()));

const aiMeetingResponseSchema = z.object({
  transcript: z.array(meetingMessageSchema).min(20),
  report: z.object({
    overallScore: scoreSchema,
    communication: scoreSchema,
    lifestyle: scoreSchema,
    values: scoreSchema,
    ambition: scoreSchema,
    conflictResolution: scoreSchema,
    greenFlags: textArraySchema,
    potentialFriction: textArraySchema,
    questionsToDiscuss: textArraySchema,
    suggestedFirstDate: z.unknown().optional(),
    suggestedFirstDates: z.array(firstDateOptionSchema).optional().default([]),
    relationshipOutlook: z.string(),
    shareCardText: z.string().nullable().optional()
  })
});

const genderedPronounPattern = /\b(he|she|him|her|his|hers)\b/i;
const objectHerFollowers = new Set([
  "about",
  "after",
  "and",
  "as",
  "because",
  "before",
  "but",
  "feel",
  "feels",
  "felt",
  "for",
  "from",
  "if",
  "in",
  "into",
  "is",
  "needs",
  "or",
  "see",
  "sees",
  "that",
  "to",
  "under",
  "when",
  "whether",
  "while",
  "with",
  "would"
]);

function hasGenderedPronouns(value: unknown): boolean {
  if (typeof value === "string") {
    return genderedPronounPattern.test(value);
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasGenderedPronouns(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => hasGenderedPronouns(item));
  }

  return false;
}

function asksQuestion(text: string) {
  return text.includes("?");
}

function topicQuestionFlowViolations(
  transcript: Array<{
    topic: (typeof meetingTopics)[number];
    content: string;
    turn?: number;
  }>
) {
  const violations: Array<{
    turn: number;
    topic: string;
    nextTurn?: number;
    nextTopic?: string;
    reason: string;
  }> = [];

  transcript.forEach((message, index) => {
    if (!asksQuestion(message.content)) {
      return;
    }

    const nextMessage = transcript[index + 1];

    if (!nextMessage) {
      violations.push({
        turn: message.turn ?? index + 1,
        topic: message.topic,
        reason: "Final transcript turn asks a question with no answer."
      });
      return;
    }

    if (nextMessage.topic !== message.topic) {
      violations.push({
        turn: message.turn ?? index + 1,
        topic: message.topic,
        nextTurn: nextMessage.turn ?? index + 2,
        nextTopic: nextMessage.topic,
        reason:
          "A question is followed by a topic change before the answer turn is complete."
      });
    }
  });

  return violations;
}

function keepAnswerTurnsOnQuestionTopic(
  transcript: MeetingTranscriptMessage[]
) {
  return transcript.map((message, index) => {
    const previousMessage = transcript[index - 1];

    if (
      previousMessage &&
      asksQuestion(previousMessage.content) &&
      message.topic !== previousMessage.topic
    ) {
      return {
        ...message,
        topic: previousMessage.topic
      };
    }

    return message;
  });
}

function possessiveName(name: string) {
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

function matchCapitalization(value: string, replacement: string) {
  return value[0] === value[0]?.toUpperCase()
    ? `${replacement[0]?.toUpperCase() ?? ""}${replacement.slice(1)}`
    : replacement;
}

function rewriteSinglePersonPronouns(text: string, name: string) {
  return text.replace(/\b(he|she|him|his|hers|her)\b/gi, (match, _pronoun, offset, fullText) => {
    const pronoun = match.toLowerCase();

    if (pronoun === "his" || pronoun === "hers") {
      return matchCapitalization(match, possessiveName(name));
    }

    if (pronoun === "her") {
      const nextWord =
        fullText
          .slice(offset + match.length)
          .match(/^\s+([A-Za-z]+)/)?.[1]
          ?.toLowerCase() ?? "";
      const replacement =
        nextWord && !objectHerFollowers.has(nextWord) ? possessiveName(name) : name;

      return matchCapitalization(match, replacement);
    }

    return matchCapitalization(match, name);
  });
}

function enforceNameLanguageInProfile(
  profile: GeneratedProxyProfile,
  name: string
): GeneratedProxyProfile {
  const rewriteList = (items: string[]) =>
    items.map((item) => rewriteSinglePersonPronouns(item, name));

  return {
    values: rewriteList(profile.values),
    traits: rewriteList(profile.traits),
    goals: rewriteList(profile.goals),
    communicationStyle: rewriteSinglePersonPronouns(
      profile.communicationStyle,
      name
    ),
    humourStyle: rewriteSinglePersonPronouns(profile.humourStyle, name),
    strengths: rewriteList(profile.strengths),
    weaknesses: rewriteList(profile.weaknesses),
    relationshipPreferences: rewriteList(profile.relationshipPreferences),
    summary: rewriteSinglePersonPronouns(profile.summary, name)
  };
}

function nearestNamedPerson(text: string, offset: number, names: string[]) {
  let bestName = names[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  names.forEach((name) => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = Array.from(text.matchAll(new RegExp(`\\b${escapedName}\\b`, "gi")));

    matches.forEach((match) => {
      if (match.index === undefined) {
        return;
      }

      const distance = Math.abs(offset - match.index);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestName = name;
      }
    });
  });

  return bestName;
}

function textIncludesKnownName(text: string, names: string[]) {
  return names.some((name) => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return new RegExp(`\\b${escapedName}\\b`, "i").test(text);
  });
}

function rewriteTwoPersonPronouns(
  text: string,
  fallbackName: string,
  names: string[]
) {
  return text.replace(/\b(he|she|him|his|hers|her)\b/gi, (match, _pronoun, offset) => {
    const pronoun = match.toLowerCase();
    const sentenceStart = Math.max(
      text.lastIndexOf(".", offset),
      text.lastIndexOf("?", offset),
      text.lastIndexOf("!", offset)
    );
    const sentenceEndCandidates = [
      text.indexOf(".", offset),
      text.indexOf("?", offset),
      text.indexOf("!", offset)
    ].filter((index) => index >= 0);
    const sentenceEnd = sentenceEndCandidates.length
      ? Math.min(...sentenceEndCandidates)
      : text.length;
    const sentence = text.slice(sentenceStart + 1, sentenceEnd);
    const sentenceOffset = offset - (sentenceStart + 1);
    const name = textIncludesKnownName(sentence, names)
      ? nearestNamedPerson(sentence, sentenceOffset, names)
      : fallbackName;

    if (pronoun === "his" || pronoun === "hers") {
      return matchCapitalization(match, possessiveName(name));
    }

    if (pronoun === "her") {
      const nextWord =
        text
          .slice(offset + match.length)
          .match(/^\s+([A-Za-z]+)/)?.[1]
          ?.toLowerCase() ?? "";
      const replacement =
        nextWord && !objectHerFollowers.has(nextWord) ? possessiveName(name) : name;

      return matchCapitalization(match, replacement);
    }

    return matchCapitalization(match, name);
  });
}

function enforceNameLanguageInMeetingData(
  data: z.infer<typeof aiMeetingResponseSchema>,
  proxyAName: string,
  proxyBName: string
): z.infer<typeof aiMeetingResponseSchema> {
  const names = [proxyAName, proxyBName];
  const rewriteReportText = (text: string) =>
    rewriteTwoPersonPronouns(text, proxyAName, names);
  const rewriteReportList = (items: string[]) => items.map(rewriteReportText);

  return {
    transcript: data.transcript.map((message) => ({
      ...message,
      content: rewriteTwoPersonPronouns(
        message.content,
        message.speakerName.startsWith(proxyBName) ? proxyBName : proxyAName,
        names
      )
    })),
    report: {
      ...data.report,
      greenFlags: rewriteReportList(data.report.greenFlags),
      potentialFriction: rewriteReportList(data.report.potentialFriction),
      questionsToDiscuss: rewriteReportList(data.report.questionsToDiscuss),
      relationshipOutlook: rewriteReportText(data.report.relationshipOutlook),
      shareCardText: data.report.shareCardText
        ? rewriteReportText(data.report.shareCardText)
        : data.report.shareCardText,
      suggestedFirstDates: data.report.suggestedFirstDates.map((date) => ({
        title: rewriteReportText(date.title),
        setting: rewriteReportText(date.setting),
        bestFor: rewriteReportText(date.bestFor),
        whyItFits: rewriteReportText(date.whyItFits),
        whatToNotice: rewriteReportText(date.whatToNotice),
        logistics: rewriteReportText(date.logistics),
        conversationPrompts: rewriteReportList(date.conversationPrompts)
      })),
      suggestedFirstDate:
        typeof data.report.suggestedFirstDate === "string"
          ? rewriteReportText(data.report.suggestedFirstDate)
          : data.report.suggestedFirstDate
    }
  };
}

async function repairMeetingNameLanguage(
  client: ReturnType<typeof getOpenAI>,
  data: z.infer<typeof aiMeetingResponseSchema>,
  proxyAName: string,
  proxyBName: string
) {
  if (!client || !hasGenderedPronouns(data)) {
    return data;
  }

  const response = await client.chat.completions.create({
    model: openAIModel,
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      {
        role: "system",
        content: [
          "You are a JSON rewrite engine for Shadow.",
          "Rewrite the provided meeting JSON so it contains zero standalone gendered third-person pronouns: he, she, him, her, his, hers.",
          "Replace every such pronoun with the correct first name or possessive first name.",
          "Preserve the JSON shape, numbers, topics, speakers, meaning, and level of detail.",
          "Return strict JSON only."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          names: [proxyAName, proxyBName],
          requiredShape:
            "{ transcript, report: { overallScore, communication, lifestyle, values, ambition, conflictResolution, greenFlags, potentialFriction, questionsToDiscuss, suggestedFirstDate, suggestedFirstDates, relationshipOutlook, shareCardText } }",
          data
        })
      }
    ]
  });
  const repaired = aiMeetingResponseSchema.safeParse(
    JSON.parse(response.choices[0]?.message.content ?? "{}")
  );

  return repaired.success ? repaired.data : data;
}

async function repairMeetingConversationFlow(
  client: ReturnType<typeof getOpenAI>,
  data: z.infer<typeof aiMeetingResponseSchema>,
  proxyAName: string,
  proxyBName: string
) {
  const violations = topicQuestionFlowViolations(data.transcript);

  if (!client || violations.length === 0) {
    return data;
  }

  const response = await client.chat.completions.create({
    model: openAIModel,
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: [
          "You are a transcript continuity editor for Shadow.",
          "Repair the provided meeting JSON so no question is ignored, stranded, or followed by a topic jump.",
          "Every question must be answered directly by the next turn before the conversation advances to a new topic.",
          "If a representative asks a question inside Conflict, the next turn must answer it as Conflict before any Ambition content begins. Apply the same rule to every topic.",
          "Rewrite the transcript into exactly 27 turns: three turns for each topic in this order: Identity, Values, Lifestyle, Money, Family, Communication, Conflict, Ambition, Long-Term Goals.",
          "Within each three-turn topic block: turn one asks one introspective question, turn two answers directly and may ask one reciprocal question, turn three answers or synthesizes and must not end with a question.",
          "It is acceptable to lightly rewrite turns and adjust topic labels, but preserve speaker alternation, report shape, useful specificity, and emotional depth.",
          "Keep the transcript conversational rather than checklist-like.",
          "Use first names instead of gendered third-person pronouns. The output must contain zero standalone words: he, she, him, her, his, hers.",
          "Return strict JSON only."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          names: [proxyAName, proxyBName],
          violations,
          requiredShape:
            "{ transcript, report: { overallScore, communication, lifestyle, values, ambition, conflictResolution, greenFlags, potentialFriction, questionsToDiscuss, suggestedFirstDate, suggestedFirstDates, relationshipOutlook, shareCardText } }",
          data
        })
      }
    ]
  });
  const repaired = aiMeetingResponseSchema.safeParse(
    JSON.parse(response.choices[0]?.message.content ?? "{}")
  );

  return repaired.success ? repaired.data : data;
}

function normalizeAIMeetingResponse(
  data: z.infer<typeof aiMeetingResponseSchema>
) {
  const demoReport = demoCompatibilityReport();
  const suggestedFirstDateValue = data.report.suggestedFirstDate;
  const legacySuggestedDates = Array.isArray(suggestedFirstDateValue)
    ? suggestedFirstDateValue
    : [suggestedFirstDateValue];
  const suggestedFirstDateObjects = legacySuggestedDates
    .map((item) => firstDateOptionSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
  const suggestedFirstDates = [
    ...suggestedFirstDateObjects,
    ...data.report.suggestedFirstDates
  ].slice(0, 3);
  const fillList = (items: string[], fallback: string[]) =>
    items.length ? items : fallback;
  const overallScore = data.report.overallScore ?? demoReport.overallScore;
  const communication = data.report.communication ?? demoReport.communication;
  const lifestyle = data.report.lifestyle ?? demoReport.lifestyle;
  const values = data.report.values ?? demoReport.values;
  const ambition = data.report.ambition ?? demoReport.ambition;
  const conflictResolution =
    data.report.conflictResolution ?? demoReport.conflictResolution;

  while (suggestedFirstDates.length < 3) {
    suggestedFirstDates.push(
      demoReport.suggestedFirstDates[suggestedFirstDates.length]
    );
  }

  return {
    transcript: keepAnswerTurnsOnQuestionTopic(
      data.transcript.map((message, index) => ({
        ...message,
        turn: index + 1
      }))
    ),
    report: {
      ...data.report,
      overallScore,
      communication,
      lifestyle,
      values,
      ambition,
      conflictResolution,
      suggestedFirstDate:
        typeof suggestedFirstDateValue === "string" && suggestedFirstDateValue
          ? suggestedFirstDateValue
          : suggestedFirstDates[0].setting,
      suggestedFirstDates,
      greenFlags: fillList(data.report.greenFlags, demoReport.greenFlags),
      potentialFriction: fillList(
        data.report.potentialFriction,
        demoReport.potentialFriction
      ),
      questionsToDiscuss: fillList(
        data.report.questionsToDiscuss,
        demoReport.questionsToDiscuss
      ),
      shareCardText:
        data.report.shareCardText ||
        `Your AIs are ${overallScore}% compatible.`
    }
  };
}

export async function generateProxyProfile(
  input: ProxyInput
): Promise<GeneratedProxyProfile> {
  const client = getOpenAI();

  if (!client) {
    return demoProxyProfile(input.name);
  }

  const response = await client.chat.completions.create({
    model: openAIModel,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are Shadow's personality engine. Produce precise, respectful, non-manipulative compatibility-relevant insights as strict JSON. Use the person's first name instead of gendered third-person pronouns. The JSON strings must contain zero standalone words: he, she, him, her, his, hers."
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Generate a Shadow representative profile.",
          requiredShape: {
            values: "string[]",
            traits: "string[]",
            goals: "string[]",
            communicationStyle: "string",
            humourStyle: "string",
            strengths: "string[]",
            weaknesses: "string[]",
            relationshipPreferences: "string[]",
            summary: "string"
          },
          input
        })
      }
    ]
  });

  const parsed = generatedProxyProfileSchema.safeParse(
    JSON.parse(response.choices[0]?.message.content ?? "{}")
  );

  if (!parsed.success) {
    throw new Error("OpenAI returned an invalid Shadow profile shape.");
  }

  return enforceNameLanguageInProfile(parsed.data, input.name);
}

export async function generateAIMeeting({
  meetingId,
  proxyA,
  proxyB
}: {
  meetingId: string;
  proxyA: ProxyRepresentative;
  proxyB: ProxyRepresentative;
}): Promise<AIMeetingResult> {
  const client = getOpenAI();

  if (!client) {
    throw new Error("OPENAI_API_KEY is required to generate a real AI meeting.");
  }

  const response = await client.chat.completions.create({
    model: openAIModel,
    response_format: { type: "json_object" },
    temperature: 0.86,
    messages: [
      {
        role: "system",
        content: [
          "You are Shadow, a premium AI compatibility product.",
          "Two AI representatives meet before the people do.",
          "This is not a dating-app gimmick. The tone is calm, specific, intelligent, emotionally careful, and useful.",
          "Generate an actual conversational meeting transcript between the two representatives, not a checklist.",
          "The representatives should ask thoughtful follow-up questions, challenge assumptions gently, notice contradictions, and explore the emotional meaning underneath surface preferences.",
          "Hard language rule: use each person's first name whenever referring to the person represented. The transcript and report must contain zero standalone gendered third-person pronouns: he, she, him, her, his, hers. Before returning JSON, scan every string and rewrite any pronoun with the correct first name or possessive first name.",
          "Hard continuity rule: never move to a new topic while a direct question is still unanswered. If a turn asks a question, the next turn must answer that question directly and stay on the same topic before introducing the next topic. Do not jump from Conflict to Ambition, or between any topics, until the prior question has been handled.",
          "Each representative should speak on behalf of their person, ask clarifying questions, respond directly to what the other said, and surface uncertainty as inference.",
          "The conversation should feel like two unusually perceptive agents trying to understand whether two real people could make each other feel safer, more alive, and more honest.",
          "Do not flatter. Do not diagnose. Do not make claims that require private facts not provided.",
          "Keep turns substantive: two to four sentences each.",
          "Use exactly three turns per topic in this order: Identity, Values, Lifestyle, Money, Family, Communication, Conflict, Ambition, Long-Term Goals. For each topic: turn one asks one introspective question, turn two answers that question directly and may ask one reciprocal question, turn three answers the reciprocal question or closes the loop with a specific synthesis and must not end with a question. Then move to the next topic.",
          "Ask rich introspective questions across the transcript. Questions should probe needs, fears, patterns, repair, attention, pace, autonomy, reassurance, ambition, and what each person finds hard to admit.",
          "Return strict JSON only."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Run a deep, conversational AI representative meeting and produce a compatibility report.",
          requiredShape: {
            transcript:
              "Array of exactly 27 turns: three turns for each of the nine topics in order. Each item: { speakerName, topic, content, turn }. speakerName must be either '<name> AI' for representative A or representative B. Use first names in content instead of he/she/him/her/his/hers pronouns.",
            report:
              "{ overallScore, communication, lifestyle, values, ambition, conflictResolution, greenFlags, potentialFriction, questionsToDiscuss, suggestedFirstDate, suggestedFirstDates, relationshipOutlook, shareCardText }"
          },
          conversationQualityBar: [
            "Make the dialogue responsive: each answer should react to the prior turn.",
            "No ignored questions: before changing topics, answer the previous turn's question in the next turn.",
            "Use three-turn topic blocks: ask, answer and optionally reciprocate, answer or synthesize without a trailing question.",
            "The third turn of each topic block must not end with a question.",
            "Prefer named, specific claims over generic compatibility language.",
            `Use direct questions like "What does ${proxyA.name} do when..." or "What would ${proxyB.name} need if..."`,
            "Include inner-life questions that the humans would actually want to discuss after reading the transcript.",
            "Avoid rigid transitions such as 'Now let us discuss money.'"
          ],
          productPrinciples: [
            "Design first",
            "Trust before virality",
            "Curiosity without manipulation",
            "Compatibility insights grounded in transcript evidence",
            "Useful questions for the humans to discuss"
          ],
          firstDateGuidance:
            "Generate exactly three first-date options in suggestedFirstDates. These should feel like the AI really reasoned from compatibility evidence, interests, emotional pace, communication style, nervous-system regulation, likely friction, and what the humans most need to discover in person. Avoid generic dinner-and-drinks advice unless the report explains precisely why that format suits these two people. Each option should include title, setting, bestFor, whyItFits, whatToNotice, logistics, and 2-3 conversationPrompts. The three options should feel meaningfully different: one quiet/deep, one curiosity-led, and one lightly active or environment-led.",
          proxyA,
          proxyB
        })
      }
    ]
  });

  const content = response.choices[0]?.message.content;

  if (!content) {
    throw new Error("OpenAI did not return meeting content.");
  }

  const parsed = aiMeetingResponseSchema.safeParse(JSON.parse(content));

  if (!parsed.success) {
    const issueSummary = parsed.error.issues
      .slice(0, 3)
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`OpenAI returned an invalid meeting shape: ${issueSummary}`);
  }

  const flowRepaired = await repairMeetingConversationFlow(
    client,
    parsed.data,
    proxyA.name,
    proxyB.name
  );
  const nameRepaired = await repairMeetingNameLanguage(
    client,
    flowRepaired,
    proxyA.name,
    proxyB.name
  );
  const pronounSafe = hasGenderedPronouns(nameRepaired)
    ? enforceNameLanguageInMeetingData(nameRepaired, proxyA.name, proxyB.name)
    : nameRepaired;
  const normalized = normalizeAIMeetingResponse(pronounSafe);

  return {
    id: meetingId,
    status: "COMPLETED",
    currentTopic: "Long-Term Goals",
    participants: { proxyA, proxyB },
    transcript: normalized.transcript,
    report: normalized.report,
    source: "openai"
  };
}

export function demoProxyRepresentative(name = "Hewie"): ProxyRepresentative {
  const profile = demoProxyProfile(name);

  if (name.toLowerCase().startsWith("hayley")) {
    return {
      ...profile,
      name,
      age: 29,
      occupation: "Product strategist",
      location: "London",
      values: ["Consistency", "Kindness", "Growth", "Emotional safety", "Follow-through"],
      traits: ["Warmly analytical", "Careful with trust", "Steady under pressure"],
      goals: [
        "Build a stable, meaningful life",
        "Find a serious partner",
        "Protect emotional calm"
      ],
      communicationStyle:
        "Measured, precise, and reassurance-oriented. Prefers calm specifics over intensity without context.",
      humourStyle:
        `Soft, dry, and situational. ${name} uses humour once emotional safety is established.`,
      strengths: [
        "Consistent when committed",
        "Good at seeing patterns",
        "Creates emotional steadiness"
      ],
      weaknesses: [
        "Can over-read ambiguity",
        "May need more reassurance early",
        "Can withdraw when pace feels too fast"
      ],
      relationshipPreferences: [
        "Clear intentions",
        "Predictable effort",
        "A partner who repairs calmly after conflict"
      ],
      summary:
        `${name}'s Shadow presents as thoughtful, steady, and careful with trust: someone who values warmth, consistency, and emotional clarity.`
    };
  }

  return {
    ...profile,
    name,
    age: 31,
    occupation: "Founder / builder",
    location: "London"
  };
}

export function demoAIMeeting(
  meetingId = "demo",
  proxyA = demoProxyRepresentative("Hewie"),
  proxyB = demoProxyRepresentative("Hayley")
): AIMeetingResult {
  const transcript: MeetingTranscriptMessage[] = [
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Identity",
      turn: 1,
      content:
        `I represent ${proxyA.name} as someone who becomes very alive around ambitious work. Before we call that intensity a strength or a risk, I want to understand what ${proxyB.name} tends to do when someone else's inner world suddenly takes up a lot of oxygen.`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Identity",
      turn: 2,
      content:
        `${proxyB.name} can admire intensity, but ${proxyB.name} watches for whether attention remains relational when a project gets loud. What does ${proxyA.name} do, concretely, to show that focus on work does not mean emotional disappearance?`
    },
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Identity",
      turn: 3,
      content:
        `${proxyA.name} usually shows care through transparency and momentum: sharing ideas, bringing someone inside the thinking, trying to repair quickly. The growth edge is that ${proxyA.name} may assume being open is the same as being steady; would ${proxyB.name} experience that as closeness, or as more information to process?`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Values",
      turn: 4,
      content:
        `${proxyB.name} would probably experience it as closeness if the openness includes reassurance, not just intensity. ${proxyB.name} values consistency, kindness, and follow-through; how does ${proxyA.name} define loyalty when ${proxyA.name} is under pressure?`
    },
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Values",
      turn: 5,
      content:
        `For ${proxyA.name}, loyalty is behavioral: showing up, telling the truth early, and not making someone guess where they stand. A useful question for ${proxyA.name} is this: when ${proxyA.name} feels consumed by a goal, what would ${proxyA.name} still protect because the relationship matters?`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Values",
      turn: 6,
      content:
        `That question matters to ${proxyB.name}. ${proxyB.name} is not asking for constant attention; ${proxyB.name} is asking whether the relationship has a protected place in the week. What does ${proxyA.name} fear would happen if a partner needed more predictability than ${proxyA.name} naturally offers?`
    },
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Lifestyle",
      turn: 7,
      content:
        `${proxyA.name} may fear that predictability becomes containment. But that fear is not the whole story; ${proxyA.name} also wants a private world that feels safe enough to return to. What rhythm would help ${proxyB.name} feel chosen without making ${proxyA.name} feel managed?`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Lifestyle",
      turn: 8,
      content:
        `${proxyB.name} would respond well to simple rituals: a planned evening, a message before a deep work stretch, a check-in that is not prompted by conflict. Would ${proxyA.name} see those rituals as romantic infrastructure or as administrative burden?`
    },
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Lifestyle",
      turn: 9,
      content:
        `${proxyA.name} would likely see them as romantic infrastructure if the purpose is explicit. The danger is unspoken expectation. ${proxyA.name} does best when needs are named plainly, so ${proxyB.name} asking directly could be a green flag rather than pressure.`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Money",
      turn: 10,
      content:
        `On money and risk, ${proxyB.name} would want to understand what ambition costs emotionally. Does ${proxyA.name} treat money as freedom, proof, protection, or a way to avoid depending on anyone?`
    },
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Money",
      turn: 11,
      content:
        `That is a sharp question. ${proxyA.name} probably sees money as freedom and leverage, but there may also be a desire to earn enough safety that vulnerability feels less risky. What does financial security symbolize for ${proxyB.name}: calm, commitment, options, or trust?`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Money",
      turn: 12,
      content:
        `For ${proxyB.name}, security is emotional as much as financial. ${proxyB.name} would not need ${proxyA.name} to avoid risk, but ${proxyB.name} would need to know when risk is shared, when it is private, and how the relationship stays stable around it.`
    },
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Family",
      turn: 13,
      content:
        `Family and long-term seriousness should not be handled like a checklist for ${proxyA.name}. ${proxyA.name} would open more if the question were, "What kind of home are you trying to become capable of creating?" How would ${proxyB.name} answer that?`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Family",
      turn: 14,
      content:
        `${proxyB.name} would probably say a home should feel emotionally predictable, but not small. ${proxyB.name} wants warmth, room for ambition, and people who repair instead of disappearing. What does ${proxyA.name} do when closeness starts to feel like responsibility?`
    },
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Family",
      turn: 15,
      content:
        `${proxyA.name} can become more serious, not less, when responsibility feels meaningful. The risk is speed: ${proxyA.name} may try to solve the emotional complexity instead of sitting inside it. ${proxyB.name} may need ${proxyA.name} to be present before being useful.`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Communication",
      turn: 16,
      content:
        `That connects directly to communication. ${proxyB.name} can handle directness, but ${proxyB.name} needs emotional framing. Could ${proxyA.name} say, "I care about this, I am moving fast internally, and I do not want you to feel left behind"?`
    },
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Communication",
      turn: 17,
      content:
        `${proxyA.name} could say that, and it would probably be good for ${proxyA.name}. My question back: when ${proxyB.name} feels uncertain, does ${proxyB.name} name the uncertainty, or does ${proxyB.name} wait to see whether ${proxyA.name} notices?`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Communication",
      turn: 18,
      content:
        `${proxyB.name} can wait too long. ${proxyB.name} may call it observation, but sometimes it becomes a silent test. A real growth question for ${proxyB.name} is: "Can ${proxyB.name} ask for reassurance before resentment becomes evidence?"`
    },
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Conflict",
      turn: 19,
      content:
        `That is important because ${proxyA.name} may miss quiet distress while trying to fix visible distress. In conflict, ${proxyA.name} needs to slow down enough to ask, "Do you want repair now, or do you need regulation first?"`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Conflict",
      turn: 20,
      content:
        `${proxyB.name} would likely feel respected by that question. ${proxyB.name} also needs to answer honestly rather than making ${proxyA.name} guess. What would ${proxyA.name} need from ${proxyB.name} after a difficult conversation so the repair feels real?`
    },
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Conflict",
      turn: 21,
      content:
        `${proxyA.name} would need a sign that the connection is intact: a clear sentence, a touch, a plan to revisit the issue. Without that, ${proxyA.name} may keep pushing for closure because uncertainty feels like distance.`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Ambition",
      turn: 22,
      content:
        `Ambition may be one of the strongest bridges here. ${proxyB.name} could admire ${proxyA.name}'s drive, but ${proxyB.name} would need to know where ${proxyB.name} belongs inside the future ${proxyA.name} is building. Does ${proxyA.name} imagine partnership as witness, collaborator, refuge, or all three?`
    },
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Ambition",
      turn: 23,
      content:
        `${proxyA.name} wants all three, though ${proxyA.name} may not always know how to ask for that without sounding demanding. A question for the humans is whether ${proxyB.name} feels energized by being close to that level of drive, or whether ${proxyB.name} feels asked to orbit it.`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Long-Term Goals",
      turn: 24,
      content:
        `Long term, the compatibility depends on pace and explicitness. ${proxyB.name} should ask ${proxyA.name}, "What do you do when you are overwhelmed but still love someone?" ${proxyA.name} should ask ${proxyB.name}, "What does consistency look like before there is a problem?"`
    },
    {
      speakerName: `${proxyA.name} AI`,
      topic: "Long-Term Goals",
      turn: 25,
      content:
        `I see strong potential if those questions are answered early. ${proxyA.name} can offer depth and momentum; ${proxyB.name} can offer steadiness and emotional pattern recognition. The risk is not incompatibility; the risk is assuming the other person experiences safety the same way.`
    },
    {
      speakerName: `${proxyB.name} AI`,
      topic: "Long-Term Goals",
      turn: 26,
      content:
        `Agreed. If ${proxyA.name} names intensity without making ${proxyB.name} manage it, and ${proxyB.name} names needs without turning them into tests, this could become a relationship where both people feel more honest rather than more edited.`
    }
  ];

  return {
    id: meetingId,
    status: "DEMO",
    currentTopic: "Long-Term Goals",
    participants: { proxyA, proxyB },
    transcript,
    report: demoCompatibilityReport(proxyA.name, proxyB.name),
    source: "demo"
  };
}

export function demoProxyProfile(name = "Hewie"): GeneratedProxyProfile {
  return {
    values: ["Depth", "Agency", "Craft", "Directness", "Emotional steadiness"],
    traits: ["Intense curiosity", "High initiative", "Low tolerance for drift"],
    goals: ["Build meaningful work", "Protect creative focus", "Grow with someone honest"],
    communicationStyle:
      "Direct, fast-moving, and detail-rich once trust is established. Prefers clarity over politeness theatre.",
    humourStyle:
      "Dry, quick, and observational. Uses humour to soften intensity without avoiding the point.",
    strengths: ["Loyal under pressure", "Energized by shared ambition", "Very transparent when engaged"],
    weaknesses: ["Can become consumed by projects", "May mistake calmness for distance", "Needs explicit recovery time"],
    relationshipPreferences: [
      "A partner who values emotional consistency",
      "Room for independent work",
      "Clear repair after conflict"
    ],
    summary: `${name}'s Shadow presents as warm but highly driven: someone who wants tenderness without losing momentum.`
  };
}

export function demoCompatibilityReport(
  proxyAName = "Hewie",
  proxyBName = "Hayley"
): CompatibilityReportData {
  return {
    overallScore: 87,
    communication: 91,
    lifestyle: 78,
    values: 89,
    ambition: 94,
    conflictResolution: 81,
    greenFlags: [
      "Both representatives described loyalty as behavior, not sentiment.",
      "Strong match around intellectual curiosity and long-term orientation.",
      "Different emotional tempos appear complementary rather than opposing."
    ],
    potentialFriction: [
      "One person accelerates when excited; the other needs consistency before speed.",
      "Conflict repair styles differ: immediate discussion versus time to regulate.",
      "Work intensity may need explicit boundaries."
    ],
    questionsToDiscuss: [
      "What does consistency look like day to day?",
      "How should we signal when we need space without creating doubt?",
      "What ambition feels exciting, and what ambition feels lonely?"
    ],
    suggestedFirstDate:
      "A quiet dinner followed by a walk somewhere with room for focused conversation.",
    suggestedFirstDates: [
      {
        title: "Quiet Dinner, Then A Walk",
        setting:
          "A low-noise restaurant followed by a walk somewhere spacious enough for uninterrupted conversation.",
        bestFor:
          "Testing emotional pace without making the first meeting feel performative.",
        whyItFits:
          `${proxyAName} and ${proxyBName} both seem to value depth, but ${proxyBName} may need calm pacing while ${proxyAName} may need room for intensity. Dinner creates focus; the walk lets the conversation breathe.`,
        whatToNotice:
          "Notice whether silence feels comfortable, whether questions become more honest after movement, and whether both people can slow down without the energy going flat.",
        logistics:
          "Book somewhere with space between tables, keep the meal under ninety minutes, and choose a walk route with an easy exit point.",
        conversationPrompts: [
          "What does consistency look like in an ordinary week?",
          "When ambition takes over, what helps you stay emotionally available?",
          "What is something you need but usually hesitate to ask for?"
        ]
      },
      {
        title: "Gallery Hour And Coffee",
        setting:
          "A small gallery, design bookstore, or photography exhibition followed by coffee at a quiet table.",
        bestFor:
          "Seeing how both people interpret, disagree, and become curious without pressure.",
        whyItFits:
          `A shared object gives ${proxyAName} and ${proxyBName} something to interpret together before turning directly toward personal topics. This reduces interview energy and reveals taste, curiosity, and emotional associations.`,
        whatToNotice:
          "Notice whether the conversation becomes playful, whether either person dominates interpretation, and whether differences in taste feel intriguing rather than corrective.",
        logistics:
          "Pick a compact exhibition or bookstore so the date has natural movement, then sit somewhere calm for the deeper part.",
        conversationPrompts: [
          "Which piece feels most like your current life, and why?",
          "What kind of beauty makes you feel calm?",
          "Do you prefer being understood quickly or discovered slowly?"
        ]
      },
      {
        title: "Sunday Market Compatibility Walk",
        setting:
          "A morning market, coffee stand, and a slow route through a neighborhood neither person needs to perform in.",
        bestFor:
          "Reading lifestyle fit through small choices, sensory pace, and low-stakes negotiation.",
        whyItFits:
          `This gives ${proxyBName} predictability and gives ${proxyAName} novelty without pressure. Small decisions along the way reveal lifestyle fit, pace, generosity, and how each person handles tiny frictions.`,
        whatToNotice:
          "Notice how plans are made, how preferences are negotiated, and whether practical choices become easy or loaded.",
        logistics:
          "Start with one agreed meeting point, keep the route loose, and set a soft two-hour cap so the date can end while the energy is still good.",
        conversationPrompts: [
          "What small ritual would make a relationship feel real to you?",
          "How do you act when a plan changes?",
          "What kind of day makes you feel most like yourself?"
        ]
      }
    ],
    relationshipOutlook:
      "High upside if both people name pace, reassurance, and work boundaries early. The representatives saw unusually strong alignment around curiosity, independence, and seriousness of intent.",
    shareCardText: "Your AIs are 87% compatible."
  };
}
