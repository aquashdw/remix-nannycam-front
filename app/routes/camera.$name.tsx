import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import { getSession } from "~/lib/session";

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
  console.log(response.status);
  return redirect("/camera/new?invalid=error")
};

export default function Camera() {
  const { name, token } = useLoaderData<typeof loader>();
  console.log(token);
  // useEffect(() => {
  //   const socket = new WebSocket("ws://localhost:8080/ws/connect?name=camera");
  //   socket.addEventListener("open", (event) => {
  //     console.log(event.type);
  //     socket.send("Hello Server!");
  //   })
  //   socket.addEventListener("message", (event) => {
  //     console.log(event.data);
  //   })
  //   socket.addEventListener("error", (event) => {
  //     console.error(event);
  //   });
  //   socket.addEventListener("close", (event) => {
  //     console.log(event);
  //   });
  // }, []);
  return (
    <main>
      <h1>Camera {name}</h1>
    </main>
  )
}
