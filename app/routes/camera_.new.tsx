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
  if (!name) return redirect("?invalid=name");
  const response = await fetch(`http://localhost:8080/cameras/${name}`, {
    method: "post",
    headers: {
      "Authorization": `Bearer ${session.get("jwt")}`,
    }
  });
  if (response.ok) return redirect(`/camera/${name}`)
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
  console.log(cameras);
  return (
    <main>
      <div className="main-content-centered">
        <h1 className="mb-4">Add a Camera</h1>
        <form className="mb-2 text-xl" method="post">
          <label htmlFor="name-input" className="me-2">Name: </label>
          <input type="text" id="name-input" name="name" className="me-2" />
          <input type="submit" className="button-pos" value="Add"/>
        </form>
      </div>
    </main>
  )
}
