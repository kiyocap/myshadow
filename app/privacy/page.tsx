import type { Metadata } from "next";

import { LegalList, LegalSection, LegalShell } from "@/components/legal/legal-shell";

const LAST_UPDATED = "June 8, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy - Shadow",
  description:
    "How Shadow collects, uses, and protects your information. We do not track you across other apps or websites.",
  robots: { index: true, follow: true }
};

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Privacy"
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          Shadow is an invitation-only matchmaker. It builds an attentive AI representative of who
          you are, introduces it to another, and gives you a compatibility reading before you ever
          meet. This Privacy Policy explains what information Shadow (&ldquo;Shadow,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;) collects, why we collect it, and the choices you have.
          Shadow is operated by HumanityOne Ltd, a company registered in England and Wales under
          company number 16736836.
        </>
      }
    >
      <LegalSection index="01" heading="The short version">
        <p>
          We collect as little as possible. To build your representative and find compatible
          matches, we send your <strong className="font-medium text-foreground">name</strong>, a{" "}
          <strong className="font-medium text-foreground">coarse (approximate) location</strong>,
          and the <strong className="font-medium text-foreground">profile and personality text</strong>{" "}
          you write to our servers. If you and another person mutually match, messages you send in
          chat are processed by our servers so they can be delivered to that person. We do not track
          you across other companies&rsquo; apps or websites, and we do not sell your personal information.
        </p>
      </LegalSection>

      <LegalSection index="02" heading="Information we collect">
        <p>
          <strong className="font-medium text-foreground">Information sent to our servers.</strong>{" "}
          To generate your AI representative and to introduce it to others, we process:
        </p>
        <LegalList
          items={[
            <>
              <strong className="font-medium text-foreground">Your name.</strong> Used to identify
              your representative in introductions and readings.
            </>,
            <>
              <strong className="font-medium text-foreground">Coarse location.</strong> An
              approximate, city- or area-level location used to suggest people near you. We do not
              collect precise GPS coordinates for this purpose.
            </>,
            <>
              <strong className="font-medium text-foreground">Profile and personality text.</strong>{" "}
              The words you write about your values, interests, and the way you connect. This is the
              raw material your representative is built from.
            </>,
            <>
              <strong className="font-medium text-foreground">Chat messages.</strong> Messages you
              send after a mutual match, so we can deliver and sync that conversation.
            </>
          ]}
        />
        <p>
          <strong className="font-medium text-foreground">Information stored on your device.</strong>{" "}
          The following stay on your iPhone and are not uploaded to us as part of normal use:
        </p>
        <LegalList
          items={[
            <>
              <strong className="font-medium text-foreground">Photos</strong> you add to your
              profile.
            </>,
            <>
              <strong className="font-medium text-foreground">Your email address</strong>, if you
              choose to provide one.
            </>,
            <>
              <strong className="font-medium text-foreground">App preferences and settings</strong>,
              stored locally so the app remembers your choices between launches.
            </>
          ]}
        />
        <p>
          We do not use this information to track you, and we have configured the app so that it does
          not enable advertising or cross-app tracking.
        </p>
      </LegalSection>

      <LegalSection index="03" heading="How we use your information">
        <p>We use the information above only to provide and improve the service, specifically to:</p>
        <LegalList
          items={[
            "Generate and refine your AI representative from your own words;",
            "Introduce your representative to other representatives and run the structured conversation between them;",
            "Produce a compatibility reading for you and surface people near you;",
            "Operate, maintain, secure, and troubleshoot the service; and",
            "Comply with our legal obligations and enforce our Terms of Use."
          ]}
        />
        <p>
          We do not use your personal information for advertising, and we do not build profiles of
          you for any third party.
        </p>
      </LegalSection>

      <LegalSection index="04" heading="Third-party AI processing">
        <p>
          Generating representatives, running introductions between them, and writing your readings
          rely on third-party large language model (LLM) and AI providers. To do this, the relevant
          text described above (your name, coarse location, and profile and personality text) is
          transmitted to and processed by these providers on our behalf.
        </p>
        <p>
          We share only what is needed for these features to work, under agreements that require the
          information to be used solely to provide the service to us. We do not authorize these
          providers to use your information for their own purposes.
        </p>
      </LegalSection>

      <LegalSection index="05" heading="Subscriptions and payments">
        <p>
          Shadow offers an optional auto-renewable subscription. All purchases are processed by Apple
          through the App Store using your Apple ID. We never see or receive your full payment card
          number or other card details. Apple may share limited transaction information with us (for
          example, that a subscription is active) so we can unlock premium features.
        </p>
        <p>
          Apple&rsquo;s handling of your payment information is governed by Apple&rsquo;s own privacy
          policy.
        </p>
      </LegalSection>

      <LegalSection index="06" heading="How we share information">
        <p>We do not sell your personal information. We share information only as follows:</p>
        <LegalList
          items={[
            <>
              <strong className="font-medium text-foreground">With AI providers</strong>, as
              described above, strictly to deliver the service.
            </>,
            <>
              <strong className="font-medium text-foreground">With Apple</strong>, for processing
              subscriptions.
            </>,
            <>
              <strong className="font-medium text-foreground">With service providers</strong> that
              host or support our infrastructure, under confidentiality obligations.
            </>,
            <>
              <strong className="font-medium text-foreground">For legal reasons</strong>, if required
              by law or to protect the rights, safety, and security of our users and the service.
            </>,
            <>
              <strong className="font-medium text-foreground">In a business transfer</strong>, if we
              are involved in a merger, acquisition, or sale of assets, subject to this policy.
            </>
          ]}
        />
      </LegalSection>

      <LegalSection index="07" heading="Data retention">
        <p>
          We keep the information sent to our servers only for as long as needed to provide the
          service to you, and to meet our legal, accounting, or reporting obligations. Information
          that lives only on your device (photos, email, and settings) remains until you delete it
          or remove the app.
        </p>
      </LegalSection>

      <LegalSection index="08" heading="Deleting your account and your choices">
        <p>
          You can delete your account at any time from within the app. Deleting your account wipes
          your associated data, including the profile information held on our servers and the data
          stored on your device. Removing the app from your device also removes the locally stored
          information described above.
        </p>
        <p>
          Depending on where you live, you may have additional rights over your personal information,
          such as the right to access, correct, or delete it. To make a request, contact us at
          hewie@humanityone.world.
        </p>
      </LegalSection>

      <LegalSection index="09" heading="Security">
        <p>
          We use reasonable technical and organizational measures designed to protect your
          information. No method of transmission or storage is completely secure, however, and we
          cannot guarantee absolute security. Keeping photos on your device, rather than on our
          servers, is part of how we limit risk; chat messages are sent to our servers only so
          matched conversations can be delivered and synced.
        </p>
      </LegalSection>

      <LegalSection index="10" heading="Children">
        <p>
          Shadow is intended for adults and is not directed to children. You must be at least 17
          years old to use Shadow. We do not knowingly collect personal information from anyone under
          17. If you believe a minor has provided us with personal information, please contact us at
          hewie@humanityone.world and we will take steps to delete it.
        </p>
      </LegalSection>

      <LegalSection index="11" heading="Tracking">
        <p>
          We do not track you. Shadow does not use your data to follow you across other companies&rsquo;
          apps and websites, and we do not link your information to third-party data for advertising
          purposes.
        </p>
      </LegalSection>

      <LegalSection index="12" heading="International users">
        <p>
          Shadow may process and store information in countries other than the one in which you live.
          Where it does, we take steps intended to ensure your information continues to be protected
          consistent with this policy and applicable law.
        </p>
      </LegalSection>

      <LegalSection index="13" heading="Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. When we do, we will revise the
          &ldquo;Last updated&rdquo; date above. If the changes are material, we will provide a more
          prominent notice. Your continued use of Shadow after an update means you accept the revised
          policy.
        </p>
      </LegalSection>

      <LegalSection index="14" heading="Contact us">
        <p>
          If you have questions or requests about your privacy, contact us at hewie@humanityone.world, or by
          mail at HumanityOne Ltd, 57 0501 Bloom West, 57 Nine Elms Lane, London, SW11 7DS, United
          Kingdom.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
