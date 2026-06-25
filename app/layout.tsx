import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Shadow - AI agents that understand you",
  description:
    "Shadow builds an attentive AI representative of who you are, introduces it to others, and gives you compatibility insight before you spend real time.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Shadow",
    description: "Chemistry you can actually inspect.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
