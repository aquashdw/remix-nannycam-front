import {FetcherWithComponents, useFetcher, useNavigate} from "@remix-run/react";
import {ActionFunctionArgs, LoaderFunctionArgs, redirect} from "@remix-run/node";
import process from "node:process";
import {getSessionHandler} from "~/lib/session";
import {ChangeEvent, useState} from "react";
import zxcvbn from "zxcvbn-typescript";

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
  if (password !== passwordCheck) return {
    status: 400,
    statusText: "Password does not match",
  };

  const score = parseInt(formData.get("score")?.toString() ?? "-1");
  if (score < 2) return {
    status: 400,
    statusText: "Password is too weak",
  };

  const code = formData.get("code");
  const response = await fetch(`${HOST}/auth/signup/code`, {
    method: "post",
    headers: {"Content-Type": "application/json",},
    body: JSON.stringify({email, code, password, passwordCheck,}),
  });
  return {
    status: response.status,
    statusText: response.ok ? "" : await response.text(),
  };
};

export default function SignUp() {
  const fetcher: FetcherWithComponents<{ status: number, statusText: string }> = useFetcher();
  const navigate = useNavigate();
  const {status, statusText} = fetcher.data ?? {status: null, statusText: null};
  const pending = fetcher.state === "submitting";
  const done = !pending && status !== null && status === 204;
  const failed = !pending && status !== null && status !== 204;

  const [password, setPassword] = useState("");
  const [score, setScore] = useState<number>(-1);
  const [check, setCheck] = useState("");
  const passMessage = (score: number) => {
    switch (score) {
      case -1:
        return "";
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Medium";
      case 3:
        return "Good";
      case 4:
        return "Great";
    }
  }
  const passMessageColor = (score: number) => {
    switch (score) {
      case -1:
      case 0:
      case 1:
        return "text-neg";
      case 2:
        return "text-neutral";
      case 3:
      case 4:
        return "text-pos";
    }
  }

  const onPassChange = (event: ChangeEvent<HTMLInputElement>) => {
    const password = event.currentTarget.value;
    setPassword(password);
    if (password.length >= 0)
      setScore(zxcvbn(password).score);
    else setScore(-1);
  }

  const onCheckChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCheck(event.currentTarget.value);
  }

  return (
      <main>
        <div className="main-content">
          <h1 className="mb-4">Sign Up with Email</h1>
          <fetcher.Form method="post">
            <input type="hidden" name="score" value={score}/>
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
            <div className="mb-1">
              <label htmlFor="password-input" className="block mb-2 text-xl">Password:</label>
              <input
                  id="password-input"
                  type="password"
                  name="password"
                  required
                  className="block w-full"
                  autoComplete="new-password"
                  onChange={onPassChange}
              />
            </div>
            <p className={`mb-2 ${passMessageColor(score)}`}>
              {passMessage(score)}
            </p>
            <div className="mb-1">
              <label htmlFor="check-input" className="block mb-2 text-xl">Password Check:</label>
              <input
                  id="check-input"
                  type="password"
                  name="password-check"
                  required
                  className="block w-full"
                  autoComplete="new-password"
                  onChange={onCheckChange}
              />
            </div>
            {password.length > 0 && check.length > 0 ?
                <p className={`mb-2 ${check === password ? "text-pos" : "text-neutral"}`}>
                  {check === password ? "Match" : "Not Match"}
                </p> : null}
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
              {pending ? <div className="status-neutral">Requesting
                Signup...</div> : null}
              {done ?
                  <div className="status-pos">Check Email</div> : null}
            </div>
          </fetcher.Form>
        </div>
      </main>
  );
}