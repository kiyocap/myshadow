import type { Metadata } from "next";

import { LegalList, LegalSection, LegalShell } from "@/components/legal/legal-shell";

const LAST_UPDATED = "June 8, 2026";

export const metadata: Metadata = {
  title: "Terms of Use - Shadow",
  description:
    "The terms and end user license agreement that govern your use of the Shadow app, including subscriptions and our zero-tolerance policy for objectionable content.",
  robots: { index: true, follow: true }
};

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Terms of Use"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          These Terms of Use (the &ldquo;Terms&rdquo;) are a binding agreement between you and
          HumanityOne Ltd, a company registered in England and Wales under company number 16736836
          (&ldquo;Shadow,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) and also serve as
          the End User License Agreement (EULA) for the Shadow application. Please read them
          carefully. By downloading, accessing, or using Shadow, you agree to these Terms. If you do
          not agree, do not use Shadow.
        </>
      }
    >
      <LegalSection index="01" heading="Acceptance of these terms">
        <p>
          By creating an account or otherwise using Shadow, you confirm that you have read,
          understood, and agree to be bound by these Terms and by our Privacy Policy, which is
          incorporated here by reference. If you are using Shadow on behalf of someone else, you
          represent that you are authorized to accept these Terms on their behalf.
        </p>
      </LegalSection>

      <LegalSection index="02" heading="Eligibility">
        <p>
          You must be at least 17 years old to use Shadow. Shadow is intended for adults seeking
          genuine connection and is not directed to minors. By using Shadow, you represent and
          warrant that you meet this age requirement and that you have the legal capacity to enter
          into these Terms.
        </p>
      </LegalSection>

      <LegalSection index="03" heading="What Shadow is">
        <p>
          Shadow builds an attentive AI representative of who you are from the words you provide,
          introduces that representative to others, and produces compatibility readings to help you
          decide whether to meet someone. Shadow uses third-party AI systems to generate
          representatives, run introductions, and write readings.
        </p>
        <p>
          Readings, suggestions, and other outputs are provided for your consideration only. They are
          not guarantees about any person, are not professional advice, and you remain solely
          responsible for your own decisions about whom you contact or meet. Always use good judgment
          and take sensible precautions when interacting with or meeting other people.
        </p>
      </LegalSection>

      <LegalSection index="04" heading="Your account and content">
        <p>
          You are responsible for the information you provide and for activity that occurs through
          your account. You agree that the information you submit is accurate and that you have the
          right to share it. You retain ownership of the content you create; you grant us a limited
          license to use, process, and transmit that content solely to operate and provide the
          service to you, including sending the necessary information to the AI providers described
          in our Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection index="05" heading="Subscriptions and billing">
        <p>
          Shadow offers an optional auto-renewable subscription that unlocks premium features. Some
          features (including chatting with a mutual match) are free. The following terms apply to
          paid subscriptions:
        </p>
        <LegalList
          items={[
            "Billing is handled by Apple through the App Store and charged to your Apple ID account at confirmation of purchase.",
            "Your subscription automatically renews for the same period at the then-current price unless you cancel it at least 24 hours before the end of the current period.",
            "Your Apple ID account is charged for renewal within 24 hours before the end of the current period.",
            "You can manage or cancel your subscription, and turn off auto-renewal, at any time in your Apple ID account settings after purchase.",
            "Prices may vary by region and are shown in the app before you purchase. Any unused portion of a free trial, where offered, is forfeited when you purchase a subscription.",
            "Payments are final and non-refundable except where required by law or by Apple's own policies. Refund requests are handled by Apple through the App Store."
          ]}
        />
        <p>
          Because all purchases are processed by Apple, we do not receive or store your payment card
          details. Apple&rsquo;s terms also apply to your purchase.
        </p>
      </LegalSection>

      <LegalSection index="06" heading="Acceptable use and zero-tolerance policy">
        <p>
          Shadow is a place for respectful, genuine connection. We have a{" "}
          <strong className="font-medium text-foreground">
            zero-tolerance policy for objectionable content and abusive behavior
          </strong>
          . You agree that you will not, and will not attempt to:
        </p>
        <LegalList
          items={[
            "Post, send, or generate content that is harassing, threatening, hateful, sexually exploitative, or otherwise abusive;",
            "Impersonate anyone, misrepresent your identity or age, or create a profile for someone other than yourself;",
            "Use Shadow to harm, intimidate, defraud, solicit, or exploit other people;",
            "Upload content that is illegal, infringes others' rights, or that you do not have permission to share;",
            "Attempt to reverse engineer, scrape, overload, or interfere with the service or its AI systems; or",
            "Use Shadow for any unlawful purpose or in violation of these Terms."
          ]}
        />
        <p>
          <strong className="font-medium text-foreground">Reporting and contact.</strong> If you
          encounter objectionable content or abusive behavior, please report it to us at [CONTACT
          EMAIL]. We review reports and aim to act on credible reports within 24 hours, which may
          include removing content and ejecting the user responsible from the service. We do not
          tolerate abusive users.
        </p>
      </LegalSection>

      <LegalSection index="07" heading="License to use the app">
        <p>
          Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable
          license to download and use Shadow on Apple devices that you own or control, as permitted
          by the App Store Terms of Service, for your personal, non-commercial use. We retain all
          rights, title, and interest in and to the app and the service that are not expressly
          granted to you.
        </p>
      </LegalSection>

      <LegalSection index="08" heading="Termination">
        <p>
          You may stop using Shadow at any time and may delete your account from within the app. We
          may suspend or terminate your access to Shadow, with or without notice, if you violate
          these Terms, if your conduct poses a risk to other users or the service, or as otherwise
          permitted by law. Provisions that by their nature should survive termination will survive,
          including ownership, disclaimers, and limitations of liability.
        </p>
      </LegalSection>

      <LegalSection index="09" heading="Disclaimers">
        <p>
          Shadow is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties
          of any kind, whether express or implied, including implied warranties of merchantability,
          fitness for a particular purpose, and non-infringement. We do not warrant that the service
          will be uninterrupted, error-free, or secure, or that any reading, match, or AI-generated
          output will be accurate or meet your expectations. You use Shadow at your own risk.
        </p>
      </LegalSection>

      <LegalSection index="10" heading="Limitation of liability">
        <p>
          To the maximum extent permitted by law, HumanityOne Ltd and its officers, employees, and
          agents will not be liable for any indirect, incidental, special, consequential, or punitive
          damages, or any loss of data, profits, or goodwill, arising out of or related to your use
          of Shadow. To the maximum extent permitted by law, our total liability for any claim
          relating to the service will not exceed the greater of the amount you paid us in the twelve
          months before the claim or USD 100.
        </p>
      </LegalSection>

      <LegalSection index="11" heading="Apple-specific terms">
        <p>
          These Terms are between you and HumanityOne Ltd only, not with Apple. Apple is not
          responsible for the app or its content. Apple has no obligation to provide support or
          maintenance for the app. In the event the app fails to conform to any applicable warranty,
          you may notify Apple, and Apple may refund the purchase price; to the maximum extent
          permitted by law, Apple has no other warranty obligation with respect to the app. Apple and
          its subsidiaries are third-party beneficiaries of these Terms and may enforce them against
          you.
        </p>
      </LegalSection>

      <LegalSection index="12" heading="Changes to these terms">
        <p>
          We may update these Terms from time to time. When we do, we will revise the &ldquo;Last
          updated&rdquo; date above. If the changes are material, we will provide a more prominent
          notice. Your continued use of Shadow after an update means you accept the revised Terms.
        </p>
      </LegalSection>

      <LegalSection index="13" heading="Governing law">
        <p>
          These Terms are governed by the laws of England and Wales, without regard to its conflict of
          laws rules. You agree to the exclusive jurisdiction of the courts located in England and Wales
          for any dispute that is not subject to arbitration or small-claims resolution, to the
          extent permitted by applicable law.
        </p>
      </LegalSection>

      <LegalSection index="14" heading="Contact us">
        <p>
          Questions about these Terms can be sent to [CONTACT EMAIL], or by mail to HumanityOne Ltd,
          57 0501 Bloom West, 57 Nine Elms Lane, London, SW11 7DS, United Kingdom.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
