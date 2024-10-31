import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { destroySession, getSession } from "~/lib/session";

export const loader = async () => {
  return redirect("/");
}

export const action = async ({
                               request,
                             }: ActionFunctionArgs) => {
  const session = await getSession(request);
  const headers = new Headers();
  if (session) {
    headers.set("Set-Cookie", await destroySession(session));
  }
  return redirect("/", {headers});
};
