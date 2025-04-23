import {LoaderFunction, LoaderFunctionArgs} from "@remix-run/node";
import {getSessionHandler} from "~/lib/session";
import {Form, Link, useLoaderData} from "@remix-run/react";

export const loader: LoaderFunction = async ({
                                               request
                                             }: LoaderFunctionArgs) => {
  const {getUsername} = await getSessionHandler(request);
  return {
    "username": getUsername(),
  }
};

export default function Index() {
  const {username} = useLoaderData<typeof loader>();
  return (
      <main>
        <div className="main-content-centered">
          <h1>CRStudio NannyCam</h1>
          {username ? <h3 className="mb-4">Hello, {username}!!! </h3> : null}
          {username ? <SelectionLinks/> : null}
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
            className="button-pos w-1/3"
            to="/signin"
        >
          Sign In
        </Link>
        <Link
            className="button-pos w-1/3"
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
              className="button-pos me-2"
              to="/monitor"
          >
            Monitor
          </Link>
          <Link
              className="button-pos"
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
