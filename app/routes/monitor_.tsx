import {LoaderFunctionArgs, redirect} from "@remix-run/node";
import {getSession} from "~/lib/session";
import {json, Link, useLoaderData, useRevalidator, useSearchParams} from "@remix-run/react";
import {useEffect} from "react";
import {ErrorToast, WarnToast} from "~/components/toast";

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
  const { revalidate } = useRevalidator();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const interval = setInterval(() => {
      revalidate();
    }, 3000);

    return () => clearInterval(interval);
  }, [revalidate]);

  return (
    <main>
      <div className="main-content">
        <div className="mb-4 flex justify-between items-baseline">
          <h1 className="text-center">Watch a Camera</h1>
          <Link to="/" className="button-neg">Back</Link>
        </div>
        {searchParams.has("error") ? <WarnToast>{searchParams.get("error") ?? "Error"}</WarnToast> : null}
        <ul className="mb-4 divide-y divide-blue-400 overflow-y-auto rounded" style={{ maxHeight: "70vh" }}>{
          Object.keys(cameras).length !== 0 ? Object.keys(cameras).map((name, index) => {
            return (
              <li key={index}>
                <Link to={encodeURIComponent(name)} className="bg-gray-200 hover:bg-white flex justify-between gap-x-6 px-3 py-5" style={{
                  pointerEvents: cameras[name].status !== "READY" ? "none" : "initial",
                  backgroundColor: cameras[name].status !== "READY" ? "oklch(70.7% 0.022 261.325)" : undefined,
                }}>
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
          }) : <h3 className="mb-3">No cameras yet</h3>
        }
        </ul>
      </div>
    </main>
  )
}

