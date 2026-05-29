import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";

import { getPrisma } from "@/lib/prisma";

const hasDatabase = Boolean(process.env.DATABASE_URL);

export const authOptions: NextAuthOptions = {
  adapter: hasDatabase ? PrismaAdapter(getPrisma()) : undefined,
  session: {
    strategy: hasDatabase ? "database" : "jwt"
  },
  pages: {
    signIn: "/signin"
  },
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM ?? "Shadow <hello@shadow.local>",
      async sendVerificationRequest({ identifier, url, provider }) {
        if (!process.env.RESEND_API_KEY) {
          throw new Error("RESEND_API_KEY is required to send magic links.");
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: provider.from,
          to: identifier,
          subject: "Your Shadow sign-in link",
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#0a0a0a">
              <h1 style="font-size:22px">Sign in to Shadow</h1>
              <p>Use this secure magic link to continue building your AI representative.</p>
              <p><a href="${url}" style="color:#2563eb">Sign in to Shadow</a></p>
            </div>
          `
        });
      }
    })
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    }
  }
};
