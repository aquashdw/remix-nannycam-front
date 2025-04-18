import {ActionFunctionArgs, LoaderFunctionArgs, redirect} from "@remix-run/node";
import {json, Link, useLoaderData, useRevalidator, useSearchParams} from "@remix-run/react";
import {useEffect} from "react";
import {ErrorToast, WarnToast} from "~/components/toast";
import process from "node:process";
import {getSessionHandler} from "~/lib/session";

const HOST = process.env.HOST ?? "http://localhost:8080";

export const action = async ({
                               request,
                             }: ActionFunctionArgs) => {
  const {getSignedIn, getJwt} = await getSessionHandler(request);
  if (!getSignedIn()) return redirect("/signin");
  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  if (!name) return redirect("?error=name");
  const response = await fetch(`${HOST}/cameras`, {
    method: "post",
    headers: {
      "Authorization": `Bearer ${getJwt()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({name, description}),
  });
  if (response.ok) return redirect(`/camera/${encodeURIComponent(name.toString())}`)
  return redirect(`?error=${response.status}`);
}

export const loader = async ({
                               request
                             }: LoaderFunctionArgs) => {
  const {getSignedIn, getJwt} = await getSessionHandler(request);
  if (!getSignedIn()) return redirect("/signin");
  const response = await fetch(`${HOST}/cameras`, {
    headers: {
      "Authorization": `Bearer ${getJwt()}`,
    }
  });
  const cameras = await response.json();
  return json({cameras});
}

export default function AddCamera() {
  const {cameras} = useLoaderData<typeof loader>();
  const {revalidate} = useRevalidator();
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
          <h1 className="mb-4 text-center">Add a Camera</h1>
          <form className="mb-2 text-xl" method="post">
            {searchParams.has("reloaded") ?
                <WarnToast>Camera was removed because page was refreshed.</WarnToast> : null}
            {searchParams.has("error") ?
                <ErrorToast>{searchParams.get("error") === "409" ? "Camera with the name exists" : "Error"}</ErrorToast> : null}
            <div className="mb-2">
              <label htmlFor="name-input" className="block mb-2 text-xl">Name: </label>
              <input
                  type="text"
                  id="name-input"
                  name="name"
                  required
                  className="block w-full"
              />
            </div>
            <div className="mb-5">
              <label htmlFor="desc-input" className="block mb-2 text-xl">Description: </label>
              <input
                  id="desc-input"
                  type="text"
                  name="description"
                  className="block w-full"
              />
            </div>
            <div className="flex justify-between">
              <input type="submit" className="button-pos" value="Add"/>
              <Link to="/" className="button-neg">Back</Link>
            </div>
          </form>
          <hr className="my-3"/>
          {Object.keys(cameras).length !== 0 ? <>
            <h3 className="mb-3">Cameras Online</h3>
            <ul className="mb-4 divide-y divide-blue-400 overflow-y-auto rounded" style={{maxHeight: "30vh"}}>{
              Object.keys(cameras).map((name, index) => {
                return (<li key={index}>
                  <div className="bg-gray-100 flex justify-between gap-x-6 px-3 py-5">
                    <div className="flex min-w-0 gap-x-4">
                      <div className="min-w-0 flex-auto">
                        <p className="text-sm/6 font-semibold text-gray-900">{name} <span
                            className="mt-1 truncate text-xs/5 text-gray-500">{cameras[name].description}</span></p>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end">
                      <p className="text-sm/6 text-gray-900">{cameras[name].status}</p>
                    </div>
                  </div>
                </li>);
              })
            }
            </ul>
          </> : <h3 className="mb-3">No cameras yet</h3>}
        </div>
      </main>
  )
}
