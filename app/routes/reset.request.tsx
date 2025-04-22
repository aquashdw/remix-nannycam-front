import {FetcherWithComponents, json, useFetcher, useNavigate} from "@remix-run/react";
import {ActionFunctionArgs} from "@remix-run/node";
import process from "node:process";

const HOST = process.env.HOST ?? "http://localhost:8080";

export const action = async ({
                               request,
                             }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const response = await fetch(`${HOST}/auth/password/reset`, {
    method: "post",
    headers: {"Content-Type": "application/json",},
    body: JSON.stringify({email,}),
  });
  return json({
    status: response.status,
    statusText: response.ok ? "" : await response.text(),
  })
};

export default function ResetRequest() {
  const fetcher: FetcherWithComponents<{ status: number, statusText: string }> = useFetcher();
  const navigate = useNavigate();
  const {status, statusText} = fetcher.data ?? {status: null, statusText: null};
  const pending = fetcher.state === "submitting";
  const done = !pending && status !== null && status === 202;
  const failed = !pending && status !== null && status !== 202;
  return (
      <main>
        <div className="main-content">
          <div className="flex mb-4 justify-between items-center">
            <h1>Forgot your password?</h1>
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
                  autoComplete="username"
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
                    onClick={() => navigate("/signin")}
                    disabled={pending || done}
                >
                  Back
                </button>
              </div>
              {failed ? <div className="status-neg">{statusText ?? "Failed"}</div> : null}
              {pending ? <div className="status-neutral">Trying to
                login...</div> : null}
              {done ?
                  <div className="status-pos">Check Email</div> : null}
            </div>
          </fetcher.Form>
        </div>
      </main>
  );
}