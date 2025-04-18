import {LoaderFunctionArgs, redirect} from "@remix-run/node";
import {getSessionHandler} from "~/lib/session";
import process from "node:process";

const HOST = process.env.HOST ?? "http://localhost:8080";

export const loader = async ({request}: LoaderFunctionArgs) => {
  const {getSignedIn, update, getSetCookie} = await getSessionHandler(request);
  if (getSignedIn()) return redirect("/");
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
  await update({jwt, username: userInfo.email, signedIn: true});
  return redirect("/", {
    headers: {
      "Set-Cookie": await getSetCookie(),
    }
  });
};
