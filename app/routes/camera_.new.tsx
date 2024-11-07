import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getSession } from "~/lib/session";
import { json, useLoaderData } from "@remix-run/react";

export const action = async ({
                               request,
                             }: ActionFunctionArgs)=> {
  const session = await getSession(request);
  if (!session.get("signedIn")) return redirect("/signin")
  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  if (!name) return redirect("?invalid=name");
  const response = await fetch(`http://localhost:8080/cameras`, {
    method: "post",
    headers: {
      "Authorization": `Bearer ${session.get("jwt")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description }),
  });
  if (response.ok) return redirect(`/camera/${encodeURIComponent(name.toString())}`)
  return redirect(`?invalid=${response.status}`);
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
  // TODO display already using camera info
  console.debug(cameras);
  return (
    <main>
      <div className="main-content">
        <h1 className="mb-4 text-center">Add a Camera</h1>
        <form className="mb-2 text-xl" method="post">
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
          <input type="submit" className="button-pos" value="Add"/>
        </form>
      </div>
    </main>
  )
}
