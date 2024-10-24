import {LoaderFunctionArgs, redirect} from "@remix-run/node";

export const loader = async ({request} : LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const response = await fetch(`http://localhost:8080/auth/signin?token=${token}`);
  const jwt = await response.text();
  // TODO ironsession
  console.log(jwt);
  return redirect("/");
};
