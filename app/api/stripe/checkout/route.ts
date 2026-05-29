import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PREMIUM_PRICE_ID) {
    return NextResponse.json(
      { error: "Stripe is not configured in this environment." },
      { status: 501 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PREMIUM_PRICE_ID,
        quantity: 1
      }
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings?checkout=cancelled`
  });

  return NextResponse.json({ url: session.url });
}
