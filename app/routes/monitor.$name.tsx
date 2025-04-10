import {ActionFunctionArgs, LoaderFunctionArgs, redirect} from "@remix-run/node";
import {json, Link, useBeforeUnload, useLoaderData, useNavigate, useSubmit} from "@remix-run/react";
import {getSession} from "~/lib/session";
import {useEffect, useRef} from "react";
import {createMonitorPeer, sendAnswer} from "~/lib/rtc";

export const action = async({
                              params, request
                            }: ActionFunctionArgs) => {
  const session = await getSession(request);
  if (!session.get("signedIn")) return redirect("/signin");
  const name = params.name;
  if (!name) throw new Response("Bad Request", { status: 400 });
  await fetch(`http://localhost:8080/cameras/${name}/monitor`, {
    method: "delete",
    headers: {
      "Authorization": `Bearer ${session.get("jwt")}`,
    },
  });
  return redirect("/monitor");
};

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

  const submit = useSubmit();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>();
  const socketRef = useRef<WebSocket>();
  const peerConnectionRef = useRef<RTCPeerConnection>();

  useBeforeUnload(() => {
    peerConnectionRef.current?.close();
    socketRef.current?.close();
    submit(new FormData(), {method: "post"});
  });

  useEffect(() => {
    if (!socketRef.current) socketRef.current = new WebSocket(`ws://localhost:8080/ws/monitor?token=${token}`);
    const socket = socketRef.current;
    peerConnectionRef.current = createMonitorPeer(socket, videoRef.current ?? new HTMLVideoElement());
    const peerConnection = peerConnectionRef.current;
    peerConnection.addEventListener('iceconnectionstatechange', () => {
      const state = peerConnection.iceConnectionState;
      console.debug('ICE state changed:', state);
      if (state === "connected" || state === "completed") {
        socket.close();
      }
      if (state === "disconnected" || state === "failed") {
        navigate("/monitor?error=Disconnected from camera");
      }
    })
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
      if (event.code === 1008) {
        alert(event.reason);
        navigate("/monitor");
      }
    });
  }, []);
  return (
    <main>
      <div className="main-content-centered">
        <div className="flex justify-between items-baseline">
          <h1 className="mb-4">Connect to Camera {name}</h1>
          <Link to="/monitor" reloadDocument className="button-neg">Back</Link>
        </div>
        {/*
        // @ts-expect-error ref types mismatch */}
        <video ref={videoRef} autoPlay={true} playsInline={true} className="min-w-full min-h-full mb-2" muted={true}>
          <track kind="captions"/>
        </ video>
      </div>
    </main>
  )
}
