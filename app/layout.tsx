import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Shadow - Let your AIs meet first",
  description:
    "Create AI representatives that learn about each person, meet before you do, and generate compatibility insights.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Shadow",
    description: "Before your first date, let your AIs talk.",
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
