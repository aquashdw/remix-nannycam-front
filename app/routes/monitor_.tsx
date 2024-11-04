import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getSession } from "~/lib/session";
import { json, useLoaderData } from "@remix-run/react";

export const loader = async ({
                               request
                             }: LoaderFunctionArgs) => {
  const session = await getSession(request);
  if (!session.get("signedIn")) return redirect("/signin")
  const response = await fetch("http://localhost:8080/cameras", {
    headers: {
      "Authorization": `Bearer ${session.get("jwt")}`,
    }
  });
  const cameras = await response.json();
  console.log(cameras);
  return json({ cameras });
}

export default function Monitor() {
  const { cameras } = useLoaderData<typeof loader>();
  return (
    <main>
      <div className="main-content">
        <h1 className="mb-4 text-center">Watch a Camera</h1>
        <ul className="divide-y divide-gray-100">{
          Object.keys(cameras).map((name, index) => {
            return (
              <li key={index} className="flex justify-between gap-x-6 py-5">
                <div className="flex min-w-0 gap-x-4">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm/6 font-semibold text-gray-900">{name}</p>
                    <p className="mt-1 truncate text-xs/5 text-gray-500">{cameras[name].description}</p>
                  </div>
                </div>
                {/*<div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">*/}
                {/*  <p className="text-sm/6 text-gray-900">Co-Founder / CEO</p>*/}
                {/*  <p className="mt-1 text-xs/5 text-gray-500">Last seen <time datetime="2023-01-23T13:23Z">3h ago</time></p>*/}
                {/*</div>*/}
              </li>)
          })
        }
        </ul>
      </div>
    </main>
  )
}

