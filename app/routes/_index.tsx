import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { getSession } from "~/lib/session";
import { Form, json, Link, useLoaderData } from "@remix-run/react";

export const loader: LoaderFunction = async ({
    request
                                     } : LoaderFunctionArgs) => {
  const session = await getSession(request);
  const data = {
    "username": session?.get("username")
  }
  return json(data);
};

export default function Index() {
  const { username } = useLoaderData<typeof loader>();
  return (
    <main>
      <div className="main-content-centered">
        <h1>CRStudio NannyCam</h1>
        {username ? <h3 className="mb-4">Hello, {username}!!! </h3> : null}
        {username ? <SelectionLinks /> : null}
        {username ? null : <p className="mb-4">Use your unused smartphones & tablets as NannyCams!</p>}
        {username ? null : <AnonLinks/>}
      </div>
    </main>
  );
}

const AnonLinks = () => {
  return (
    <div className="flex justify-evenly items-center">
      <Link
        className="text-xl text-blue-600 w-1/3 rounded-xl bg-neutral-200 px-3 py-2 hover:text-white hover:bg-blue-700 disabled:text-gray-400 disabled:bg-blue-600 transition ease-in"
        to="/signin"
      >
        Sign In
      </Link>
      <Link
        className="text-xl text-blue-600 w-1/3 rounded-xl bg-neutral-200 px-3 py-2 hover:text-white hover:bg-blue-700 disabled:text-gray-400 disabled:bg-blue-600 transition ease-in"
        to="/signup"
      >
        Sign Up
      </Link>
    </div>
  );
}

const SelectionLinks = () => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex justify-start items-center w-1/2">
        <Link
          className="text-xl text-blue-600 me-1 rounded-xl bg-neutral-200 px-3 py-2 hover:text-white hover:bg-blue-700 disabled:text-gray-400 disabled:bg-blue-600 transition ease-in"
          to="/monitor"
        >
          Monitor
        </Link>
        <Link
          className="text-xl text-blue-600 rounded-xl bg-neutral-200 px-3 py-2 hover:text-white hover:bg-blue-700 disabled:text-gray-400 disabled:bg-blue-600 transition ease-in"
          to="/camera/new"
        >
          Camera
        </Link>
      </div>
      <Form action="signout" method="post">
        <button type="submit" className="text-lg">Sign Out</button>
      </Form>
    </div>
  );
}
