import {ActionFunctionArgs, redirect} from "@remix-run/node";
import {getSessionHandler} from "~/lib/session";

export const loader = async () => {
  return redirect("/");
}

export const action = async ({
                               request,
                             }: ActionFunctionArgs) => {
  const {getSignedIn, destroySession} = await getSessionHandler(request);
  if (!getSignedIn()) return redirect("/signin");
  const headers = new Headers();
  if (destroySession) {
    headers.set("Set-Cookie", await destroySession());
  }
  return redirect("/", {headers});
};
