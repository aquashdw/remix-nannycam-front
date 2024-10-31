import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getSession } from "~/lib/session";

export const loader = async ({request} : LoaderFunctionArgs) => {
  const session = await getSession(request);
  if (session.get("signedIn") === true) {
    return redirect("/");
  }
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const signupResponse = await fetch(`http://localhost:8080/auth/signup/verify?token=${token}`, {
    method: "post",
  });
  return redirect(`/signin?signup=${signupResponse.ok}`)
};
