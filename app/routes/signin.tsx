import { useFetcher } from "@remix-run/react";
import { ActionFunctionArgs } from "@remix-run/node";

export const action = async ({
  request,
}: ActionFunctionArgs)=> {
  const formData = await request.formData();
  console.log(formData.get("email"));
  return null;
};

export default function SignIn() {
  const fetcher = useFetcher();
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
              className="block w-full text-lg rounded-md border-0 py-2 px-3 text-black"
            />
          </div>
          <button className="text-xl text-blue-400 rounded-xl bg-white px-4 py-3">Submit</button>
        </fetcher.Form>
      </div>
    </main>
  );
}