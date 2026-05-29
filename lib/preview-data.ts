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
    speaker: "Emily AI",
    topic: "Identity",
    content: "Emily values consistency and predictability, especially when a connection starts to feel important."
  },
  {
    speaker: "Hewie AI",
    topic: "Values",
    content: "Hewie is attracted to independence, but Hewie needs explicit signs that independence is not emotional withdrawal."
  },
  {
    speaker: "Emily AI",
    topic: "Communication",
    content: "Emily responds best to calm specificity. Ambiguity makes Emily spend energy decoding rather than connecting."
  },
  {
    speaker: "Hewie AI",
    topic: "Conflict",
    content: "Hewie will try to repair quickly, sometimes before the other person has had enough time to understand what they feel."
  },
  {
    speaker: "Emily AI",
    topic: "Long-Term Goals",
    content: "Emily is not looking for performance. Emily is looking for a reliable private world with someone ambitious and kind."
  }
];

export const dashboardStats = [
  { label: "Meetings remaining", value: "3", detail: "Free plan" },
  { label: "Shadow confidence", value: "82%", detail: "Needs 2 more imports" },
  { label: "Latest report", value: "87%", detail: "Emily AI" }
];

export const activeTopics = meetingTopics.map((topic, index) => ({
  topic,
  status: index < 5 ? "complete" : index === 5 ? "active" : "queued"
}));
