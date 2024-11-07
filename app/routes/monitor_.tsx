import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getSession } from "~/lib/session";
import { json, Link, useLoaderData } from "@remix-run/react";

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
  return json({ cameras });
}

export default function MonitorSelect() {
  const { cameras } = useLoaderData<typeof loader>();
  return (
    <main>
      <div className="main-content">
        <div className="mb-4 flex justify-between items-baseline">
          <h1 className="text-center">Watch a Camera</h1>
          <Link to="/" className="button-neg">Back</Link>
        </div>
        <ul className="mb-4 divide-y divide-blue-400 overflow-y-auto" style={{ maxHeight: "70vh" }}>{
          Object.keys(cameras).map((name, index) => {
            return (
              <li key={index}>
                <Link to={encodeURIComponent(name)} className="bg-gray-100 flex justify-between gap-x-6 px-3 py-5">
                  <div className="flex min-w-0 gap-x-4">
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm/6 font-semibold text-gray-900">{name} <span
                        className="mt-1 truncate text-xs/5 text-gray-500">{cameras[name].description}</span></p>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end">
                    <p className="text-sm/6 text-gray-900">{cameras[name].status}</p>
                  </div>
                </Link>
              </li>
            )
          })
        }
        </ul>
      </div>
    </main>
  )
}

