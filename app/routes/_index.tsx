import {LoaderFunction, LoaderFunctionArgs, redirect} from "@remix-run/node";
import {destroySession, getSession} from "~/lib/session";

export const loader: LoaderFunction = async ({
    request
                                     } : LoaderFunctionArgs) => {
  const session = await getSession(request);
  const headers = new Headers();
  if (session) {
    console.log(session.data);
    console.log(session.get("username"));
    headers.set("Set-Cookie", await destroySession(session));
  }
  return redirect("/signin", { headers });
};
