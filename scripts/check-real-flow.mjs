const baseUrl = process.env.SHADOW_BASE_URL ?? "http://localhost:3000";

async function assertStatus(path, expectedStatus, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...init
  });

  if (response.status !== expectedStatus) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `${path} expected ${expectedStatus}, got ${response.status}. ${body.slice(0, 220)}`
    );
  }

  return response;
}

async function assertRedirect(path, expectedLocation) {
  const response = await assertStatus(path, 307);
  const location = response.headers.get("location");

  if (location !== expectedLocation) {
    throw new Error(`${path} expected redirect to ${expectedLocation}, got ${location}`);
  }
}

async function assertJson(path, expectedStatus, init, predicate) {
  const response = await assertStatus(path, expectedStatus, init);
  const data = await response.json();

  if (!predicate(data)) {
    throw new Error(`${path} returned unexpected JSON: ${JSON.stringify(data)}`);
  }

  return data;
}

await assertRedirect("/meeting/live", "/dashboard/meetings");
await assertRedirect("/reports/live", "/dashboard/meetings");

await assertJson(
  "/api/meetings",
  404,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meetingId: "definitely-not-real" })
  },
  (data) => typeof data.error === "string" && data.error.includes("No paired invite")
);

await assertJson(
  "/api/reports/live",
  404,
  undefined,
  (data) => typeof data.error === "string" && data.error.includes("real invite meeting")
);

await assertJson(
  "/api/meetings",
  200,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meetingId: "demo" })
  },
  (data) =>
    data.id === "demo" &&
    data.source === "demo" &&
    data.participants?.proxyB?.name === "Hayley"
);

console.log(`Real-flow checks passed for ${baseUrl}`);
