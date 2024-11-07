import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { json, useBeforeUnload, useLoaderData } from "@remix-run/react";
import { getSession } from "~/lib/session";
import { useEffect, useRef } from "react";
import { createMonitorPeer, sendAnswer } from "~/lib/rtc";


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

export default function Monitor() {
  const { name, token } = useLoaderData<typeof loader>();

  const videoRef = useRef<HTMLVideoElement>();
  const peerConnectionRef = useRef<RTCPeerConnection>()
  useBeforeUnload(() => {
    peerConnectionRef.current?.close();
  });

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:8080/ws/monitor?token=${token}`);
    peerConnectionRef.current = createMonitorPeer(socket, videoRef.current ?? new HTMLVideoElement());
    const peerConnection = peerConnectionRef.current;
    socket.addEventListener("message", async (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== "ICE") console.debug(data);
      if (data.type === "OFFER") {
        console.debug("get offer");
        const offer = JSON.parse(data.payload);
        console.debug("videoRef current: ", videoRef.current);
        await sendAnswer(socket, offer, peerConnection);
      }
      else if (data.type === "ICE") {
        const ice = JSON.parse(data.payload);
        await peerConnection.addIceCandidate(ice);
      }
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
        {/*
        // @ts-expect-error ref types mismatch */}
        <video ref={videoRef} autoPlay={true} playsInline={true} className="min-w-full min-h-full mb-2" muted={true}>
          <track kind="captions"/>
        </ video>
      </div>
    </main>
  )
}
