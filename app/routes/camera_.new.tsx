import {ActionFunctionArgs, LoaderFunctionArgs, redirect} from "@remix-run/node";
import {getSession} from "~/lib/session";
import {json, Link, useLoaderData, useRevalidator, useSearchParams} from "@remix-run/react";
import {useEffect} from "react";

export const action = async ({
                               request,
                             }: ActionFunctionArgs)=> {
  const session = await getSession(request);
  if (!session.get("signedIn")) return redirect("/signin")
  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  if (!name) return redirect("?error=name");
  const response = await fetch(`http://localhost:8080/cameras`, {
    method: "post",
    headers: {
      "Authorization": `Bearer ${session.get("jwt")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description }),
  });
  if (response.ok) return redirect(`/camera/${encodeURIComponent(name.toString())}`)
  return redirect(`?error=${response.status}`);
}

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

export default function AddCamera() {
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
        <h1 className="mb-4 text-center">Add a Camera</h1>
        <form className="mb-2 text-xl" method="post">
          {searchParams.has("reloaded") ? <div
              className="flex items-center w-full p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800">
            <div
                className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-orange-500 bg-orange-100 rounded-lg dark:bg-orange-700 dark:text-orange-200">
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                   viewBox="0 0 20 20">
                <path
                    d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>
              </svg>
              <span className="sr-only">Warning icon</span>
            </div>
            <div className="ms-3 font-normal text-sm">Camera was removed because page was refreshed.</div>
          </div> : null}
          {searchParams.has("error") ? <div id="toast-danger"
                                              className="flex items-center w-full p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800"
                                              role="alert">
            <div
                className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                   viewBox="0 0 20 20">
                <path
                    d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"/>
              </svg>
              <span className="sr-only">Error icon</span>
            </div>
            <div className="ms-3 text-sm font-normal">{searchParams.get("error") === "409" ? "Camera with the name exists" : "Error"}</div>
          </div> : null}
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
