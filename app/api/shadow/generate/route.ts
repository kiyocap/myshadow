import { NextResponse } from "next/server";

import { demoProxyProfile, generateProxyProfile, proxyInputSchema } from "@/lib/ai";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = proxyInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Shadow input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const profile = await generateProxyProfile(parsed.data);

    return NextResponse.json({
      profile,
      embeddingStatus: process.env.OPENAI_API_KEY ? "queued" : "demo"
    });
  } catch (error) {
    return NextResponse.json({
      profile: demoProxyProfile(parsed.data.name),
      embeddingStatus: "demo",
      warning:
        error instanceof Error
          ? error.message
          : "Shadow generation failed; returned a sample profile."
    });
  }
}
