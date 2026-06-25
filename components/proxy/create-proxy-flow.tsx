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
  PhotoUploader,
  SocialConnect,
  VoiceNoteRecorder,
  type Socials
} from "@/components/proxy/profile-extras";
import {
  LEGACY_LOCAL_PROXY_PROFILE_KEY,
  LOCAL_PROXY_PROFILE_KEY,
  LOCAL_USER_LOCATION_KEY,
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
  "flex h-11 w-full rounded-none border border-input bg-card px-3.5 py-2 text-sm text-foreground transition-colors focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50";

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
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Hewie");
  const [age, setAge] = useState("31");
  const [occupation, setOccupation] = useState("Founder / builder");
  const [homeLocation, setHomeLocation] = useState("Battersea");
  const [workLocation, setWorkLocation] = useState("City of London");
  const [starSign, setStarSign] = useState("");
  const [myersBriggs, setMyersBriggs] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [socials, setSocials] = useState<Socials>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [llmImport, setLlmImport] = useState("");
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
    const invite = new URLSearchParams(window.location.search).get("invite");
    setInviteCode(invite);
  }, []);

  useEffect(() => {
    if (profileStatus === "idle") {
      setProfile(demoProxyProfile(name || "Your"));
    }
  }, [name, profileStatus]);

  function toggleAnswer(questionId: string, option: string) {
    setFormError(null);
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

  function getIdentityError() {
    const parsedAge = Number(age);

    if (!name.trim()) {
      return "Add your name before continuing.";
    }

    if (!age.trim() || Number.isNaN(parsedAge) || parsedAge < 1) {
      return "Add a valid age before continuing.";
    }

    if (!occupation.trim()) {
      return "Add your occupation before continuing.";
    }

    if (!homeLocation.trim()) {
      return "Add where you live before continuing.";
    }

    if (!starSign) {
      return "Choose a star sign before continuing.";
    }

    if (!myersBriggs) {
      return "Choose a Myers-Briggs option, or choose I don't know.";
    }

    return null;
  }

  function getGuidedAnswersError() {
    const unansweredQuestion = guidedQuestions.find(
      (question) => (selectedAnswers[question.id] ?? []).length === 0
    );

    if (unansweredQuestion) {
      return `Choose at least one answer for "${unansweredQuestion.label}" before continuing.`;
    }

    return null;
  }

  function getLLMImportError() {
    if (!llmImport.trim()) {
      return "Paste your LLM import before continuing.";
    }

    return null;
  }

  function getStepError(stepToValidate: number) {
    if (stepToValidate === 0) {
      return getIdentityError();
    }

    if (stepToValidate === 1) {
      return getGuidedAnswersError();
    }

    if (stepToValidate === 2) {
      return getLLMImportError();
    }

    return null;
  }

  function getNavigationBlocker(nextStep: number) {
    for (let index = 0; index < nextStep; index += 1) {
      const message = getStepError(index);

      if (message) {
        return { step: index, message };
      }
    }

    return null;
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
          location: [homeLocation, workLocation].filter(Boolean).join(" · "),
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
    if (nextStep > step) {
      const blocker = getNavigationBlocker(nextStep);

      if (blocker) {
        setStep(blocker.step);
        setFormError(blocker.message);
        return;
      }
    }

    setFormError(null);
    setStep(nextStep);

    if (nextStep === 3 && profileStatus !== "ready" && profileStatus !== "demo") {
      await generateProfile();
    }
  }

  function buildLocalProfile(): LocalProxyProfile {
    const importWordCount = llmImport.trim()
      ? llmImport.trim().split(/\s+/).length
      : 0;

    return {
      name: name || "Your",
      age: Number(age) || undefined,
      occupation,
      location: homeLocation,
      homeLocation,
      workLocation,
      starSign: starSign || undefined,
      myersBriggs: myersBriggs || undefined,
      photos,
      voiceNote,
      socials,
      profile,
      guidedAnswers: selectedAnswers,
      selectedSignalCount,
      importWordCount,
      source: profileStatus === "ready" ? "openai" : "demo",
      updatedAt: new Date().toISOString()
    };
  }

  function saveProxyLocally(localProfile: LocalProxyProfile) {
    window.localStorage.setItem(
      LOCAL_PROXY_PROFILE_KEY,
      JSON.stringify(localProfile)
    );
    window.localStorage.removeItem(LEGACY_LOCAL_PROXY_PROFILE_KEY);
    // Persist home/work so Discover can suggest dates without re-asking.
    window.localStorage.setItem(
      LOCAL_USER_LOCATION_KEY,
      JSON.stringify({ home: homeLocation, work: workLocation })
    );
  }

  async function saveProxyToAccount(localProfile: LocalProxyProfile) {
    const response = await fetch("/api/shadow/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...localProfile,
        llmImport
      })
    });

    if (response.status === 401) {
      const callbackPath = inviteCode
        ? `/create-shadow?invite=${encodeURIComponent(inviteCode)}`
        : "/create-shadow";
      router.push(`/signin?callbackUrl=${encodeURIComponent(callbackPath)}`);
      return false;
    }

    if (!response.ok) {
      setProfileError("Saved locally, but account sync is waiting for production database setup.");
      return true;
    }

    return true;
  }

  async function acceptInvite() {
    if (!inviteCode) return null;

    const response = await fetch(`/api/invites/${encodeURIComponent(inviteCode)}/accept`, {
      method: "POST"
    });

    if (response.status === 401) {
      router.push(
        `/signin?callbackUrl=${encodeURIComponent(`/create-shadow?invite=${inviteCode}`)}`
      );
      return null;
    }

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      setProfileError(
        data?.error ??
          "Your Shadow is saved, but the invite could not be connected. Please open the invite link again."
      );
      return null;
    }

    return (await response.json()) as {
      meetingId: string;
      participantCount: number;
    };
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
      <aside className="border border-border bg-card p-6 lg:sticky lg:top-8 lg:h-fit">
        <Badge tone="blue">Create Shadow</Badge>
        <h1 className="mt-5 font-display text-4xl font-light tracking-tightish">Build your representative</h1>
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
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs text-background"
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

      <section className="border border-border bg-card p-6">
        {formError && (
          <div className="mb-6 border-l-2 border-claret bg-accent px-4 py-3 text-sm leading-6 text-foreground">
            {formError}
          </div>
        )}

        {step === 0 && (
          <div>
            <h2 className="font-display text-2xl font-light tracking-tightish">Identity</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(event) => {
                    setFormError(null);
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
                  required
                  value={age}
                  onChange={(event) => {
                    setFormError(null);
                    setAge(event.target.value);
                    setProfileStatus("idle");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  required
                  value={occupation}
                  onChange={(event) => {
                    setFormError(null);
                    setOccupation(event.target.value);
                    setProfileStatus("idle");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="home-location">Where you live</Label>
                <Input
                  id="home-location"
                  required
                  placeholder="e.g. Battersea"
                  value={homeLocation}
                  onChange={(event) => {
                    setFormError(null);
                    setHomeLocation(event.target.value);
                    setProfileStatus("idle");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work-location">
                  Where you work <span className="text-muted-foreground">· optional</span>
                </Label>
                <Input
                  id="work-location"
                  placeholder="e.g. City of London"
                  value={workLocation}
                  onChange={(event) => {
                    setFormError(null);
                    setWorkLocation(event.target.value);
                    setProfileStatus("idle");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="star-sign">Star sign</Label>
                <select
                  id="star-sign"
                  className={selectClassName}
                  required
                  value={starSign}
                  onChange={(event) => {
                    setFormError(null);
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
                  required
                  value={myersBriggs}
                  onChange={(event) => {
                    setFormError(null);
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

            <div className="mt-8 space-y-5">
              <PhotoUploader photos={photos} onChange={setPhotos} />
              <VoiceNoteRecorder value={voiceNote} onChange={setVoiceNote} />
              <SocialConnect value={socials} onChange={setSocials} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-display text-2xl font-light tracking-tightish">Guided answers</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Select what feels true. You can move quickly without writing a
              personal essay.
            </p>
            <div className="mt-5 border-l-2 border-claret bg-accent px-4 py-3 text-sm text-foreground">
              {selectedSignalCount} signals selected. More signal gives the
              representative sharper instincts.
            </div>
            <div className="mt-8 space-y-8">
              {guidedQuestions.map((question) => (
                <div key={question.id} className="border-b border-border pb-7 last:border-b-0 last:pb-0">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                    <div>
                      <h3 className="font-display text-base font-light">{question.label}</h3>
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
                              ? "rounded-full border border-foreground bg-foreground px-4 py-2 text-sm text-background transition-colors"
                              : "rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-claret/40 hover:text-foreground"
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
            <h2 className="font-display text-2xl font-light tracking-tightish">LLM Import</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask your AI to summarize what it knows about you, then paste the
              response here. It gives Shadow a richer starting point without
              needing file uploads.
            </p>
            <div className="mt-8 space-y-5">
              <div className="border border-border bg-background p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow text-claret">Step 1</p>
                    <p className="mt-2 font-display text-base font-light">Prompt for your AI</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use this with ChatGPT, Claude, Gemini, or another LLM.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={copyPrompt} type="button">
                    <Clipboard className="h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <pre className="mt-5 max-h-80 overflow-auto border border-border bg-card p-5 text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                  {llmPrompt}
                </pre>
              </div>

              <div className="border border-border p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="eyebrow text-claret">Step 2</p>
                    <Label className="mt-2 block text-base" htmlFor="llm-import">
                      Paste your AI&apos;s response
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Required before generating your profile.
                  </p>
                </div>
                <Textarea
                  id="llm-import"
                  className="mt-5 min-h-80 resize-y"
                  placeholder="Paste the profile your AI generated here. Shadow will use this as extra personality signal for your representative."
                  required
                  value={llmImport}
                  onChange={(event) => {
                    setFormError(null);
                    setLlmImport(event.target.value);
                    setProfileStatus("idle");
                  }}
                />
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
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
              <Sparkles className="h-5 w-5 text-claret" />
              <h2 className="font-display text-2xl font-light tracking-tightish">AI personality engine</h2>
            </div>
            <p className="mt-4 font-display text-lg font-light leading-8">{profile.summary}</p>
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
              <p className="mt-4 border-l border-claret pl-3 text-sm leading-6 text-muted-foreground">
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
                  <p className="eyebrow text-muted-foreground">{title as string}</p>
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
            onClick={() => {
              setFormError(null);
              setStep((current) => Math.max(current - 1, 0));
            }}
            disabled={step === 0}
            type="button"
          >
            Back
          </Button>
          <Button
            onClick={async () => {
              if (step === 3) {
                const blocker = getNavigationBlocker(3);

                if (blocker) {
                  setStep(blocker.step);
                  setFormError(blocker.message);
                  return;
                }

                const localProfile = buildLocalProfile();
                saveProxyLocally(localProfile);

                const saved = await saveProxyToAccount(localProfile);
                if (!saved) return;

                const invite = await acceptInvite();

                if (invite?.participantCount && invite.participantCount >= 2) {
                  router.push(`/meeting/${invite.meetingId}`);
                  return;
                }

                router.push(inviteCode ? "/dashboard/meetings" : "/dashboard/my-shadow");
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
