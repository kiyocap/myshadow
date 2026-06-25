import type { Metadata } from "next";

import { LegalList, LegalSection, LegalShell } from "@/components/legal/legal-shell";

const LAST_UPDATED = "June 19, 2026";

export const metadata: Metadata = {
  title: "Support - Shadow",
  description:
    "Get help with Shadow, including account access, billing, safety, privacy, and AI compatibility readings.",
  robots: { index: true, follow: true }
};

export default function SupportPage() {
  return (
    <LegalShell
      eyebrow="Support"
      title="How can we help?"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          Shadow is operated by HumanityOne Ltd. If you need help with the app,
          your account, a reading, billing, privacy, or safety, contact us at{" "}
          <a className="link-underline text-foreground" href="mailto:hewie@humanityone.world">
            hewie@humanityone.world
          </a>
          . We aim to respond as quickly as possible.
        </>
      }
    >
      <LegalSection index="01" heading="Contact support">
        <p>
          Email us with the issue you are seeing, the device you are using, and
          any relevant screenshots. Please do not include sensitive personal
          details unless they are needed to explain the issue.
        </p>
        <LegalList
          items={[
            "Support email: hewie@humanityone.world",
            "Company: HumanityOne Ltd",
            "App: Shadow for iPhone",
            "Response topics: account access, subscriptions, readings, invites, safety, privacy, and deletion requests"
          ]}
        />
      </LegalSection>

      <LegalSection index="02" heading="Account and access">
        <p>
          If you cannot sign in, create your Shadow, accept an invite, or open a
          meeting report, email support with the email address you used in the
          app and a short description of what happened.
        </p>
      </LegalSection>

      <LegalSection index="03" heading="Billing and subscriptions">
        <p>
          Purchases and subscriptions are handled by Apple through the App Store.
          You can manage or cancel subscriptions in your Apple ID settings.
          If premium access does not appear after purchase, contact support and
          include the approximate purchase time.
        </p>
      </LegalSection>

      <LegalSection index="04" heading="Safety and reports">
        <p>
          Shadow has zero tolerance for abusive, hateful, exploitative, or
          objectionable content. You can report or block people from inside the
          app where those controls are available. If something urgent needs
          review, email support with enough context for us to investigate.
        </p>
      </LegalSection>

      <LegalSection index="05" heading="Privacy and deletion">
        <p>
          You can delete your account from inside the app. For privacy questions,
          deletion requests, or data access requests, email us at{" "}
          <a className="link-underline text-foreground" href="mailto:hewie@humanityone.world">
            hewie@humanityone.world
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
