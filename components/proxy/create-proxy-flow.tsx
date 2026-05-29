"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clipboard, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { demoProxyProfile, type GeneratedProxyProfile } from "@/lib/ai";
import {
  LEGACY_LOCAL_PROXY_PROFILE_KEY,
  LOCAL_PROXY_PROFILE_KEY,
  type LocalProxyProfile
} from "@/lib/proxy-storage";

const starSigns = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces"
];

const myersBriggsTypes = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP"
];

const selectClassName =
  "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const guidedQuestions = [
  {
    id: "motivation",
    label: "What motivates you?",
    helper: "Choose the signals that feel most true.",
    options: [
      "Building something ambitious",
      "Solving difficult problems",
      "Feeling deeply understood",
      "Creating security and freedom",
      "Learning obsessively",
      "Making people proud",
      "Experiencing beauty and novelty",
      "Being useful to people I love"
    ]
  },
  {
    id: "frustrations",
    label: "What frustrates you?",
    helper: "Pick the patterns that drain you fastest.",
    options: [
      "Inconsistency",
      "Small talk without depth",
      "Avoided conversations",
      "Low effort",
      "Feeling controlled",
      "Chaotic planning",
      "Emotional ambiguity",
      "People who do not follow through"
    ]
  },
  {
    id: "goals",
    label: "What are your goals?",
    helper: "Select the future you are actually optimizing for.",
    options: [
      "Build meaningful work",
      "Protect creative focus",
      "Become more emotionally steady",
      "Find a serious partner",
      "Travel and expand my world",
      "Make more money without losing myself",
      "Create a family",
      "Live with more discipline"
    ]
  },
  {
    id: "lookingFor",
    label: "What are you looking for?",
    helper: "Set the tone of the connection you want.",
    options: [
      "A calm serious connection",
      "Playful chemistry",
      "Someone ambitious",
      "Someone emotionally consistent",
      "A slow build",
      "A direct spark",
      "Intellectual companionship",
      "Long-term partnership"
    ]
  },
  {
    id: "greatRelationship",
    label: "What does a great relationship look like?",
    helper: "Choose the relationship operating system.",
    options: [
      "Clear repair after conflict",
      "Mutual independence",
      "Daily affection",
      "Shared ambition",
      "Quiet reliability",
      "Honest hard conversations",
      "Lots of humour",
      "A private world together"
    ]
  }
];

function getLLMImportPrompt(name: string) {
  return `I am creating an AI representative for a product called Shadow.

Shadow lets two people's AI representatives meet before the people do, then creates compatibility insights.

Please analyze what you know about me from our conversations and produce a direct, specific profile that could help my AI representative speak accurately on my behalf.

My name is ${name || "[your name]"}.

Return the profile in Markdown with these sections:
- Core values
- Personality traits
- Goals and ambition
- Communication style
- Humour style
- Strengths
- Weaknesses or blind spots
- What I am likely looking for in a relationship
- What frustrates me in a relationship
- How I act under stress or conflict
- What a potential partner should understand about me
- Five questions my AI should ask another person's AI before I meet them

Be honest rather than flattering. Use concrete language. Do not invent facts you do not know. If something is uncertain, label it as an inference.`;
}

export function CreateProxyFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Hewie");
  const [age, setAge] = useState("31");
  const [occupation, setOccupation] = useState("Founder / builder");
  const [location, setLocation] = useState("London");
  const [starSign, setStarSign] = useState("");
  const [myersBriggs, setMyersBriggs] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [llmImport, setLlmImport] = useState("");
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<GeneratedProxyProfile>(() =>
    demoProxyProfile(name || "Your")
  );
  const [profileStatus, setProfileStatus] = useState<"idle" | "generating" | "ready" | "demo">(
    "idle"
  );
  const [profileError, setProfileError] = useState<string | null>(null);
  const llmPrompt = useMemo(() => getLLMImportPrompt(name), [name]);
  const selectedSignalCount = Object.values(selectedAnswers).reduce(
    (total, answers) => total + answers.length,
    0
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  useEffect(() => {
    if (profileStatus === "idle") {
      setProfile(demoProxyProfile(name || "Your"));
    }
  }, [name, profileStatus]);

  function toggleAnswer(questionId: string, option: string) {
    setProfileStatus("idle");
    setSelectedAnswers((current) => {
      const active = current[questionId] ?? [];
      const next = active.includes(option)
        ? active.filter((item) => item !== option)
        : [...active, option];

      return {
        ...current,
        [questionId]: next
      };
    });
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(llmPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setProfileError("Clipboard access is unavailable in this browser.");
    }
  }

  function answerSignal(questionId: string, fallback: string) {
    const selected = selectedAnswers[questionId] ?? [];
    const value = selected.join(", ");

    return value.length >= 20 ? value : fallback;
  }

  async function generateProfile() {
    setProfileStatus("generating");
    setProfileError(null);

    try {
      const response = await fetch("/api/shadow/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name || "Your",
          age: Number(age) || undefined,
          occupation,
          location,
          starSign: starSign || undefined,
          myersBriggs: myersBriggs || undefined,
          motivation: answerSignal(
            "motivation",
            "Building meaningful work, solving difficult problems, and feeling deeply understood."
          ),
          frustrations: answerSignal(
            "frustrations",
            "Inconsistency, shallow communication, avoided conversations, and low effort."
          ),
          goals: answerSignal(
            "goals",
            "Build meaningful work, protect creative focus, and grow with someone honest."
          ),
          lookingFor: answerSignal(
            "lookingFor",
            "A serious, emotionally consistent connection with intellectual companionship."
          ),
          greatRelationship: answerSignal(
            "greatRelationship",
            "Clear repair after conflict, mutual independence, affection, humour, and a private world together."
          ),
          imports: llmImport.trim()
            ? [{ type: "CHATGPT_EXPORT", text: llmImport.trim() }]
            : undefined
        })
      });
      const data = (await response.json()) as {
        profile?: GeneratedProxyProfile;
        embeddingStatus?: string;
        warning?: string;
        error?: string;
      };

      if (!response.ok || !data.profile) {
        throw new Error(data.error ?? "Shadow generation failed.");
      }

      setProfile(data.profile);
      setProfileStatus(data.embeddingStatus === "demo" ? "demo" : "ready");
      setProfileError(data.warning ?? null);
    } catch (error) {
      setProfile(demoProxyProfile(name || "Your"));
      setProfileStatus("demo");
      setProfileError(
        error instanceof Error
          ? error.message
          : "Shadow generation failed; showing a preview profile."
      );
    }
  }

  async function goToStep(nextStep: number) {
    setStep(nextStep);

    if (nextStep === 3 && profileStatus !== "ready" && profileStatus !== "demo") {
      await generateProfile();
    }
  }

  function saveProxyLocally() {
    const importWordCount = llmImport.trim()
      ? llmImport.trim().split(/\s+/).length
      : 0;
    const localProfile: LocalProxyProfile = {
      name: name || "Your",
      age: Number(age) || undefined,
      occupation,
      location,
      starSign: starSign || undefined,
      myersBriggs: myersBriggs || undefined,
      profile,
      guidedAnswers: selectedAnswers,
      selectedSignalCount,
      importWordCount,
      source: profileStatus === "ready" ? "openai" : "demo",
      updatedAt: new Date().toISOString()
    };

    window.localStorage.setItem(
      LOCAL_PROXY_PROFILE_KEY,
      JSON.stringify(localProfile)
    );
    window.localStorage.removeItem(LEGACY_LOCAL_PROXY_PROFILE_KEY);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
      <aside className="border border-border bg-white p-6 lg:sticky lg:top-8 lg:h-fit">
        <Badge tone="blue">Create Shadow</Badge>
        <h1 className="mt-5 text-4xl font-semibold">Build your representative</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Shadow works best when it has honest signal. Start with the essentials,
          choose the patterns that fit, then add an LLM import when you want more
          precision.
        </p>
        <div className="mt-8 space-y-3">
          {["Identity", "Guided answers", "LLM Import", "AI profile"].map(
            (item, index) => (
              <button
                key={item}
                className="flex w-full items-center gap-3 text-left text-sm"
                onClick={() => goToStep(index)}
                type="button"
              >
                <span
                  className={
                    step === index
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white"
                      : "flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs"
                  }
                >
                  {index < step ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span className={step === index ? "font-medium" : "text-muted-foreground"}>
                  {item}
                </span>
              </button>
            )
          )}
        </div>
      </aside>

      <section className="border border-border bg-white p-6">
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-semibold">Identity</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setProfileStatus("idle");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(event) => {
                    setAge(event.target.value);
                    setProfileStatus("idle");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={occupation}
                  onChange={(event) => {
                    setOccupation(event.target.value);
                    setProfileStatus("idle");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(event) => {
                    setLocation(event.target.value);
                    setProfileStatus("idle");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="star-sign">Star sign</Label>
                <select
                  id="star-sign"
                  className={selectClassName}
                  value={starSign}
                  onChange={(event) => {
                    setStarSign(event.target.value);
                    setProfileStatus("idle");
                  }}
                >
                  <option value="">Select star sign</option>
                  {starSigns.map((sign) => (
                    <option key={sign} value={sign}>
                      {sign}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="myers-briggs">Myers-Briggs</Label>
                <select
                  id="myers-briggs"
                  className={selectClassName}
                  value={myersBriggs}
                  onChange={(event) => {
                    setMyersBriggs(event.target.value);
                    setProfileStatus("idle");
                  }}
                >
                  <option value="">Select type</option>
                  <option value="I don't know">I don't know</option>
                  {myersBriggsTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold">Guided answers</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Select what feels true. You can move quickly without writing a
              personal essay.
            </p>
            <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {selectedSignalCount} signals selected. More signal gives the
              representative sharper instincts.
            </div>
            <div className="mt-8 space-y-8">
              {guidedQuestions.map((question) => (
                <div key={question.id} className="border-b border-border pb-7 last:border-b-0 last:pb-0">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                    <div>
                      <h3 className="font-semibold">{question.label}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {question.helper}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(selectedAnswers[question.id] ?? []).length} selected
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {question.options.map((option) => {
                      const selected = (selectedAnswers[question.id] ?? []).includes(option);

                      return (
                        <button
                          key={option}
                          className={
                            selected
                              ? "rounded-full border border-black bg-black px-4 py-2 text-sm text-white transition-colors"
                              : "rounded-full border border-border bg-white px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          }
                          onClick={() => toggleAnswer(question.id, option)}
                          type="button"
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-semibold">LLM Import</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask your AI to summarize what it knows about you, then paste the
              response here. It gives Shadow a richer starting point without
              needing file uploads.
            </p>
            <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="border border-border bg-[#fafafa] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">Prompt for your AI</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use this with ChatGPT, Claude, Gemini, or another LLM.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={copyPrompt} type="button">
                    <Clipboard className="h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <pre className="mt-5 max-h-[460px] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-white p-4 text-xs leading-6 text-muted-foreground">
                  {llmPrompt}
                </pre>
              </div>
              <div className="space-y-3">
                <Label htmlFor="llm-import">Paste your AI's response</Label>
                <Textarea
                  id="llm-import"
                  className="min-h-[560px]"
                  placeholder="Paste the profile your AI generated here. Shadow will use this as extra personality signal for your representative."
                  value={llmImport}
                  onChange={(event) => {
                    setLlmImport(event.target.value);
                    setProfileStatus("idle");
                  }}
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  Do not paste passwords, API keys, private financial details, or
                  anything you would not want used as personality context.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h2 className="text-2xl font-semibold">AI personality engine</h2>
            </div>
            <p className="mt-4 text-lg leading-8">{profile.summary}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Badge tone={profileStatus === "ready" ? "blue" : "neutral"}>
                {profileStatus === "generating"
                  ? "Generating"
                  : profileStatus === "ready"
                    ? "AI-generated"
                    : "Preview profile"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {selectedSignalCount} guided signals
                {llmImport.trim() ? ` · ${llmImport.trim().split(/\s+/).length} imported words` : ""}
              </p>
            </div>
            {profileError && (
              <p className="mt-4 border-l border-blue-600 pl-3 text-sm leading-6 text-muted-foreground">
                {profileError}
              </p>
            )}
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                ["Values", profile.values],
                ["Traits", profile.traits],
                ["Strengths", profile.strengths],
                ["Weaknesses", profile.weaknesses]
              ].map(([title, items]) => (
                <div key={title as string} className="border border-border p-5">
                  <p className="text-sm font-semibold">{title as string}</p>
                  <div className="mt-4 space-y-2">
                    {(items as string[]).map((item) => (
                      <p key={item} className="text-sm leading-6 text-muted-foreground">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between border-t border-border pt-6">
          <Button
            variant="secondary"
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            disabled={step === 0}
            type="button"
          >
            Back
          </Button>
          <Button
            onClick={async () => {
              if (step === 3) {
                saveProxyLocally();
                router.push("/dashboard/my-shadow");
                return;
              }

              const nextStep = Math.min(step + 1, 3);
              await goToStep(nextStep);
            }}
            disabled={profileStatus === "generating"}
            type="button"
          >
            {profileStatus === "generating"
              ? "Generating"
              : step === 3
                ? "Finish"
                : "Continue"}{" "}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
