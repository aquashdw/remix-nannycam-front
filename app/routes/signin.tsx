import {FetcherWithComponents, json, useFetcher, useLoaderData} from "@remix-run/react";
import {ActionFunctionArgs, LoaderFunctionArgs, redirect} from "@remix-run/node";
import process from "node:process";
import {getSessionHandler} from "~/lib/session";

const HOST = process.env.HOST ?? "http://localhost:8080";

export const loader = async ({
                               request
                             }: LoaderFunctionArgs) => {
  const {getSignedIn} = await getSessionHandler(request);
  if (getSignedIn()) return redirect("/");
  const url = new URL(request.url);
  const success = url.searchParams.get("signup");
  return json({signupStatus: success});
}

export const action = async ({
                               request,
                             }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const signinResponse = await fetch(`${HOST}/auth/signin/password`, {
    method: "post",
    headers: {"Content-Type": "application/json",},
    body: JSON.stringify({email, password,}),
  });
  if (!signinResponse.ok)
    return json({status: signinResponse.status});

  const jwt = await signinResponse.text();
  const jwtResponse = await fetch(`${HOST}/auth/user-info`, {
    headers: {
      "Authorization": `Bearer ${jwt}`
    }
  });
  if (!jwtResponse.ok) {
    // TODO something's wrong
    console.error("server rejects issued jwt");
    redirect("/");
  }

  const {update, getSetCookie} = await getSessionHandler(request);
  const userInfo = await jwtResponse.json();
  await update({jwt, username: userInfo.email, signedIn: true});
  return redirect("/", {
    headers: {
      "Set-Cookie": await getSetCookie(),
    }
  });
};

export default function SignIn() {
  const fetcher: FetcherWithComponents<{ status: number }> = useFetcher();
  const {signupStatus} = useLoaderData<typeof loader>();
  const signupSuccess = signupStatus === "true";

  const {status} = fetcher.data ?? {status: null};
  const pending = fetcher.state === "submitting";
  const done = !pending && status !== null && status === 204;
  const failed = !pending && status !== null && status !== 204;
  return (
      <main>
        <div className="main-content">
          <div className="flex mb-4 justify-between items-center">
            <h1>Sign In with Email</h1>
            {signupStatus ?
                <div
                    className={"rounded-md py-1 px-2 border-1 " + (signupSuccess ? "bg-green-400 border-green-500" : "bg-red-400 border-red-500")}
                >
                  Sign Up {signupSuccess ? "Success" : "Failed"}
                </div> : null}
          </div>
          <fetcher.Form method="post">
            <div className="mb-4">
              <label htmlFor="email-input" className="block mb-2 text-xl">Email: </label>
              <input
                  id="email-input"
                  type="email"
                  name="email"
                  required
                  className="block w-full"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password-input" className="block mb-2 text-xl">Password:</label>
              <input
                  id="password-input"
                  type="password"
                  name="password"
                  required
                  className="block w-full"
              />
            </div>
            <div className="flex justify-between items-center">
              <button
                  className="text-xl text-blue-600 rounded-xl bg-neutral-200 px-3 py-2 hover:text-white hover:bg-blue-700 disabled:text-gray-400 disabled:bg-blue-600 transition ease-in"
                  disabled={pending || done}
              >
                Submit
              </button>
              {failed ? <div className="rounded-md py-2 px-3 border-2 bg-red-400 border-red-500">Failed</div> : null}
              {pending ? <div className="rounded-md py-2 px-3 border-2 bg-cyan-400 border-cyan-500">Trying to
                login...</div> : null}
              {done ?
                  <div className="rounded-md py-2 px-3 border-2 bg-green-400 border-green-500">Check Email</div> : null}
            </div>
          </fetcher.Form>
        </div>
      </main>
  );
}