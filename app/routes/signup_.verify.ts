import {LoaderFunctionArgs, redirect} from "@remix-run/node";
import {getSessionHandler} from "~/lib/session";
import * as process from "node:process";

const HOST = process.env.HOST ?? "http://localhost:8080";

export const loader = async ({request}: LoaderFunctionArgs) => {
  const {getSignedIn} = await getSessionHandler(request);
  if (getSignedIn()) return redirect("/");
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const response = await fetch(`${HOST}/auth/signup/verify?token=${token}`, {
    method: "post",
  });
  if (!response.ok) redirect("/singup/error");
  return redirect(`/signin?state=signup`);
};
