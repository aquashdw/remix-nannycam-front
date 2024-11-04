import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import { getSession } from "~/lib/session";
import { useEffect } from "react";


export const loader = async ({
  params, request
}: LoaderFunctionArgs) => {
  const session = await getSession(request);
  if (!session.get("signedIn")) return redirect("/signin");
  const name = params.name;
  if (!name) throw new Response("Bad Request", { status: 400 });
  const response = await fetch(`http://localhost:8080/cameras/${name}`, {
    headers: {
      "Authorization": `Bearer ${session.get("jwt")}`,
    },
  });
  if (response.ok) {
    const { token } = await response.json();
    return json({ name, token });
  }
  return redirect("/monitor")
};

export default function Camera() {
  const { name, token } = useLoaderData<typeof loader>();

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:8080/ws/monitor?token=${token}`);
    socket.addEventListener("message", (event) => {
      console.log(event.data);
      socket.send("monitor ack");
    })
    socket.addEventListener("error", (event) => {
      console.error(event);
    });
    socket.addEventListener("close", (event) => {
      console.log(event);
    });
  }, []);
  return (
    <main>
      <div className="main-content-centered">
        <h1 className="mb-4">Connect to Camera {name}</h1>
      </div>
    </main>
  )
}
