import { NextResponse } from "next/server";

export const dynamic = "force-static";

const appID = `${process.env.APPLE_TEAM_ID ?? "262H6ZNK8Y"}.com.humanityone.shadow`;

export function GET() {
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID,
            paths: ["/invite/*"]
          }
        ]
      }
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
