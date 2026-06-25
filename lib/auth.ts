import { createHash } from "node:crypto";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";

import { getPrisma } from "@/lib/prisma";

const hasDatabase = Boolean(process.env.DATABASE_URL);
// Demo access is available whenever there is no database, or when explicitly enabled.
const demoEnabled = process.env.DEMO_MODE === "true" || !hasDatabase;

function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "Guest";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Guest";
}

const emailProvider = EmailProvider({
  from: process.env.EMAIL_FROM ?? "Shadow <hello@shadow.local>",
  async sendVerificationRequest({ identifier, url, provider }) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is required to send magic links.");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: provider.from,
      to: identifier,
      subject: "Your Shadow sign-in link",
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#0a0a0a">
          <h1 style="font-size:22px">Sign in to Shadow</h1>
          <p>Use this secure magic link to continue building your AI representative.</p>
          <p><a href="${url}" style="color:#7a2a3f">Sign in to Shadow</a></p>
        </div>
      `
    });

    if (result.error) {
      console.error("Shadow magic link send failed", {
        to: identifier,
        error: result.error.message
      });
      throw new Error(result.error.message);
    }

    console.info("Shadow magic link send accepted", {
      to: identifier,
      id: result.data?.id ?? null
    });
  }
});

const demoProvider = CredentialsProvider({
  id: "demo",
  name: "Demo access",
  credentials: {
    email: { label: "Email", type: "email" }
  },
  async authorize(credentials) {
    const email = (credentials?.email?.toString().trim().toLowerCase() || "guest@shadow.to");
    const id = `demo-${createHash("sha256").update(email).digest("hex").slice(0, 24)}`;
    return { id, email, name: nameFromEmail(email) };
  }
});

export const authOptions: NextAuthOptions = {
  adapter: hasDatabase ? PrismaAdapter(getPrisma()) : undefined,
  session: {
    // Credentials/demo access requires JWT sessions; database sessions are used only with a real DB.
    strategy: hasDatabase && !demoEnabled ? "database" : "jwt"
  },
  pages: {
    signIn: "/signin"
  },
  providers: [
    ...(hasDatabase ? [emailProvider] : []),
    ...(demoEnabled ? [demoProvider] : [])
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
      }
      return token;
    },
    session({ session, user, token }) {
      if (session.user) {
        session.user.id = (user?.id ?? (token?.uid as string | undefined)) ?? session.user.id;
      }
      return session;
    }
  }
};
