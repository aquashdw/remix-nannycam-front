import { createCookie } from "@remix-run/node"; // or cloudflare/deno

export const sessionCookie = createCookie("sessionid", {
  path: "/",
  maxAge: 604_800,
  sameSite: "lax",
  httpOnly: true,
  secure: true,
});
