import { LoaderFunctionArgs } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";

export const loader = async ({
  params
}: LoaderFunctionArgs) => {
  const name = params.name;
  if (!name) throw new Response("Bad Request", { status: 400 });
  return json({ name });
};

export default function Camera() {
  const { name } = useLoaderData<typeof loader>()
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
