import {FetcherWithComponents, useFetcher, useNavigate, useSearchParams} from "@remix-run/react";
import {ActionFunctionArgs, redirect} from "@remix-run/node";
import process from "node:process";

const HOST = process.env.SERVER_HOST ?? "http://localhost:8080";

export const action = async ({
                               request,
                             }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const token = formData.get("token");
  const password = formData.get("password");
  const passwordCheck = formData.get("password-check");
  const response = await fetch(`${HOST}/auth/password/reset`, {
    method: "put",
    headers: {"Content-Type": "application/json",},
    body: JSON.stringify({token, password, passwordCheck,}),
  });
  if (!response.ok)
    return {status: response.status, statusText: response.ok ? "" : await response.text(),};
  return redirect("/signin?state=reset");
};

export default function ResetSubmit() {

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const fetcher: FetcherWithComponents<{ status: number, statusText: string }> = useFetcher();
  const {status, statusText} = fetcher.data ?? {status: null, statusText: null};
  const pending = fetcher.state === "submitting";
  const failed = !pending && status !== null && status !== 204;

  const navigate = useNavigate();

  return (
      <main>
        <div className="main-content">
          <div className="flex mb-2 justify-between items-center">
            <h1>New password</h1>
          </div>
          <div className="mb-4">
            <p>For your security, we can&apos;t recover your current password.</p>
            <p>Please enter a new password below to reset your account.</p>
          </div>
          <fetcher.Form method="post">
            <input type="hidden" autoComplete="username" readOnly/>
            <input type="hidden" name="token" value={token}/>
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
            <div className="mb-5">
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
                    onClick={() => navigate("/signin")}
                    disabled={pending}
                >
                  Back
                </button>
              </div>
              {failed ? <div className="status-neg">{statusText ?? "Failed"}</div> : null}
              {pending ? <div className="status-neutral">Trying to
                login...</div> : null}
            </div>
          </fetcher.Form>
        </div>
      </main>
  );
}