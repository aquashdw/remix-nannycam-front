import {FetcherWithComponents, json, useFetcher} from "@remix-run/react";
import {ActionFunctionArgs} from "@remix-run/node";

export const action = async ({
  request,
}: ActionFunctionArgs)=> {
  const formData = await request.formData();
  const email = formData.get("email");
  const code = formData.get("code");
  const response = await fetch(`http://localhost:8080/auth/signup/code`, {
    method: "post",
    headers: { "Content-Type": "application/json", },
    body: JSON.stringify({ email, code, }),
  });
  return json({ status: response.status });
};

export default function SignUp() {
  const fetcher : FetcherWithComponents<{ status: number }> = useFetcher();
  const { status } = fetcher.data ?? { status: null};
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
            <button
              className="text-xl text-blue-600 rounded-xl bg-neutral-200 px-3 py-2 hover:text-white hover:bg-blue-700 disabled:text-gray-400 disabled:bg-blue-600 transition ease-in"
              disabled={pending || done}
            >
              Submit
            </button>
            {failed ? <div className="rounded-md bg-red-400 py-2 px-3 border-2 border-red-500">Failed</div> : null}
            {pending ? <div className="rounded-md bg-cyan-400 py-2 px-3 border-2 border-cyan-500">Trying to
              login...</div> : null}
            {done ?
              <div className="rounded-md bg-green-400 py-2 px-3 border-2 border-green-500">Check Email</div> : null}
          </div>
        </fetcher.Form>
      </div>
    </main>
  );
}