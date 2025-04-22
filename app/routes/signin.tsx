import {FetcherWithComponents, json, useFetcher, useLoaderData, useNavigate} from "@remix-run/react";
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
  const signInResponse = await fetch(`${HOST}/auth/signin/password`, {
    method: "post",
    headers: {"Content-Type": "application/json",},
    body: JSON.stringify({email, password,}),
  });
  if (!signInResponse.ok)
    return json({status: signInResponse.status, statusText: signInResponse.ok ? "" : await signInResponse.text(),});

  const jwt = await signInResponse.text();
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
  const fetcher: FetcherWithComponents<{ status: number, statusText: string }> = useFetcher();
  const {signupStatus} = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const signupSuccess = signupStatus === "true";

  const {status, statusText} = fetcher.data ?? {status: null, statusText: null};
  const pending = fetcher.state === "submitting";
  const failed = !pending && status !== null && status !== 204;
  return (
      <main>
        <div className="main-content">
          <div className="flex mb-4 justify-between items-center">
            <h1>Sign In with Email</h1>
            {signupStatus ?
                <div
                    className={signupSuccess ? "status-pos" : "status-neg"}
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
                  autoComplete="current-password"
              />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <button
                    className="button-pos me-2"
                    disabled={pending}
                >
                  Submit
                </button>
                <button
                    className="button-neg"
                    onClick={() => navigate("/")}
                    disabled={pending}
                >
                  Back
                </button>
              </div>
              {failed ? <div className="status-neg">{statusText ?? "Failed"}</div> : null}
              {pending ? <div className="status-pend">Trying to
                login...</div> : null}
            </div>
          </fetcher.Form>
        </div>
      </main>
  );
}