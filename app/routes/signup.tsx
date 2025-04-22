import {FetcherWithComponents, json, useFetcher, useNavigate} from "@remix-run/react";
import {ActionFunctionArgs, LoaderFunctionArgs, redirect} from "@remix-run/node";
import process from "node:process";
import {getSessionHandler} from "~/lib/session";

const HOST = process.env.HOST ?? "http://localhost:8080";

export const loader = async ({request}: LoaderFunctionArgs) => {
  const {getSignedIn} = await getSessionHandler(request);
  if (getSignedIn()) return redirect("/");
  return {};
}

export const action = async ({
                               request,
                             }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const passwordCheck = formData.get("password-check");
  const code = formData.get("code");
  const response = await fetch(`${HOST}/auth/signup/code`, {
    method: "post",
    headers: {"Content-Type": "application/json",},
    body: JSON.stringify({email, code, password, passwordCheck,}),
  });
  return json({status: response.status, statusText: response.ok ? "" : await response.text(),});
};

export default function SignUp() {
  const fetcher: FetcherWithComponents<{ status: number, statusText: string }> = useFetcher();
  const navigate = useNavigate();
  const {status, statusText} = fetcher.data ?? {status: null, statusText: null};
  const pending = fetcher.state === "submitting";
  const done = !pending && status !== null && status === 204;
  const failed = !pending && status !== null && status !== 204;
  return (
      <main>
        <div className="main-content">
          <h1 className="mb-4">Sign Up with Email</h1>
          <fetcher.Form method="post">
            <div className="mb-2">
              <label htmlFor="email-input" className="block mb-2 text-xl">Email: </label>
              <input
                  id="email-input"
                  type="email"
                  name="email"
                  required
                  className="block w-full"
                  autoComplete="username"
              />
            </div>
            <div className="mb-2">
              <label htmlFor="password-input" className="block mb-2 text-xl">Password:</label>
              <input
                  id="password-input"
                  type="password"
                  name="password"
                  required
                  className="block w-full"
                  autoComplete="new-password"
              />
            </div>
            <div className="mb-2">
              <label htmlFor="check-input" className="block mb-2 text-xl">Password Check:</label>
              <input
                  id="check-input"
                  type="password"
                  name="password-check"
                  required
                  className="block w-full"
                  autoComplete="new-password"
              />
            </div>
            {/*<div className="mb-2">*/}
            {/*  <label htmlFor="request-input" className="block mb-2 text-xl">Request: </label>*/}
            {/*  <input*/}
            {/*    id="request-input"*/}
            {/*    type="text"*/}
            {/*    name="code"*/}
            {/*    required*/}
            {/*    className="block w-full text-lg rounded-md border-0 py-2 px-3 bg-gray-50 text-black"*/}
            {/*  />*/}
            {/*</div>*/}
            <div className="mb-5">
              <label htmlFor="code-input" className="block mb-2 text-xl">Code: </label>
              <input
                  id="code-input"
                  type="text"
                  name="code"
                  required
                  className="block w-full"
              />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <button
                    className="button-pos me-2"
                    disabled={pending || done}
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
              {pending ? <div className="status-pend">Requesting
                Signup...</div> : null}
              {done ?
                  <div className="status-pos">Check Email</div> : null}
            </div>
          </fetcher.Form>
        </div>
      </main>
  );
}