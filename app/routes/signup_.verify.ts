import {LoaderFunctionArgs, redirect} from "@remix-run/node";
import {getSession} from "~/lib/session";
import * as process from "node:process";

const HOST = process.env.HOST ?? "http://localhost:8080";

export const loader = async ({request}: LoaderFunctionArgs) => {
  const session = await getSession(request);
  if (session.get("signedIn") === true) {
    return redirect("/");
  }
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const signupResponse = await fetch(`${HOST}/auth/signup/verify?token=${token}`, {
    method: "post",
  });
  return redirect(`/signin?signup=${signupResponse.ok}`)
};
