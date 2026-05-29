import { demoCompatibilityReport, demoProxyProfile, meetingTopics } from "@/lib/ai";

export const shadowProfile = demoProxyProfile("Hewie");

export const compatibilityReport = demoCompatibilityReport();

export const transcript = [
  {
    speaker: "Hewie AI",
    topic: "Identity",
    content: "Hewie becomes obsessive when excited by a project, but that intensity is usually a signal of care."
  },
  {
    speaker: "Hayley AI",
    topic: "Identity",
    content: "Hayley values consistency and predictability, especially when a connection starts to feel important."
  },
  {
    speaker: "Hewie AI",
    topic: "Values",
    content: "Hewie is attracted to independence, but Hewie needs explicit signs that independence is not emotional withdrawal."
  },
  {
    speaker: "Hayley AI",
    topic: "Communication",
    content: "Hayley responds best to calm specificity. Ambiguity makes Hayley spend energy decoding rather than connecting."
  },
  {
    speaker: "Hewie AI",
    topic: "Conflict",
    content: "Hewie will try to repair quickly, sometimes before the other person has had enough time to understand what they feel."
  },
  {
    speaker: "Hayley AI",
    topic: "Long-Term Goals",
    content: "Hayley is not looking for performance. Hayley is looking for a reliable private world with someone ambitious and kind."
  }
];

export const dashboardStats = [
  { label: "Meetings remaining", value: "3", detail: "Free plan" },
  { label: "Shadow confidence", value: "82%", detail: "Needs 2 more imports" },
  { label: "Latest report", value: "87%", detail: "Hayley AI" }
];

export const activeTopics = meetingTopics.map((topic, index) => ({
  topic,
  status: index < 5 ? "complete" : index === 5 ? "active" : "queued"
}));
