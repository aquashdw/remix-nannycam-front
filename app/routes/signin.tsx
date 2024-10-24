import {FetcherWithComponents, json, useFetcher} from "@remix-run/react";
import {ActionFunctionArgs} from "@remix-run/node";

export const action = async ({
  request,
}: ActionFunctionArgs)=> {
  const formData = await request.formData();
  const email = formData.get("email");
  const response = await fetch("http://localhost:8080/auth/signin", {
    method: "post",
    headers: { "Content-Type": "application/json", },
    body: JSON.stringify({ email, }),
  });
  return json({ status: response.status });
};

export default function SignIn() {
  const fetcher : FetcherWithComponents<{ status: number }> = useFetcher();
  const { status } = fetcher.data ?? { status: null};
  const pending = fetcher.state === "submitting";
  const done = !pending && status !== null && status === 204;
  const failed = !pending && status !== null && status !== 204;
  return (
    <main className="min-h-screen flex justify-center items-center">
      <div className="rounded-lg p-10 xl:w-5/12 lg:w-3/6 md:w-4/6 w-5/6 bg-blue-500 text-white">
        <h1 className="text-4xl mb-4">Sign In with Email</h1>
        <fetcher.Form method="post">
          <div className="mb-4">
            <label htmlFor="email-input" className="block mb-2 text-xl">Email: </label>
            <input
              id="email-input"
              type="email"
              name="email"
              required
              className="block w-full text-lg rounded-md border-0 py-2 px-3 bg-gray-50 text-black"
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
            {pending ? <div className="rounded-md bg-cyan-400 py-2 px-3 border-2 border-cyan-500">Trying to login...</div> : null}
            {done ? <div className="rounded-md bg-green-400 py-2 px-3 border-2 border-green-500">Check Email</div> : null}
          </div>
        </fetcher.Form>
      </div>
    </main>
  );
}