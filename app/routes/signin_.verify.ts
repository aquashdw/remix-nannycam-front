import {LoaderFunctionArgs, redirect} from "@remix-run/node";
import {getSession, updateSession} from "~/lib/session";
import process from "node:process";

const HOST = process.env.HOST ?? "http://localhost:8080";

export const loader = async ({request}: LoaderFunctionArgs) => {
  const session = await getSession(request);
  if (session.get("signedIn") === true) {
    return redirect("/");
  }
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const jwtResponse = await fetch(`${HOST}/auth/signin?token=${token}`);
  const jwt = await jwtResponse.text();
  const response = await fetch(`${HOST}/auth/user-info`, {
    headers: {
      "Authorization": `Bearer ${jwt}`
    }
  });
  if (!response.ok) {
    // TODO something's wrong
    console.error("server rejects issued jwt");
    redirect("/");
  }

  const userInfo = await response.json();
  return redirect("/", {
    headers: {
      "Set-Cookie": await updateSession(session, {
        jwt,
        username: userInfo.email,
        signedIn: true,
        updatedAt: Date.now(),
      })
    }
  });
};
