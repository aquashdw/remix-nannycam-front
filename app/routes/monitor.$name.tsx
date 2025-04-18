import {ActionFunctionArgs, LoaderFunctionArgs, redirect} from "@remix-run/node";
import {json, Link, useBeforeUnload, useLoaderData, useNavigate, useSubmit} from "@remix-run/react";
import {getSessionHandler} from "~/lib/session";
import {useEffect, useRef} from "react";
import {createMonitorPeer, sendAnswer} from "~/lib/rtc";
import process from "node:process";

const HOST = process.env.HOST ?? "http://localhost:8080";
const AUTHORITY = HOST.split("//")[1];

export const action = async ({
                               params, request
                             }: ActionFunctionArgs) => {
  const {getSignedIn, getJwt} = await getSessionHandler(request);
  if (!getSignedIn()) return redirect("/signin");
  const name = params.name;
  if (!name) throw new Response("Bad Request", {status: 400});
  await fetch(`${HOST}/cameras/${name}/monitor`, {
    method: "delete",
    headers: {
      "Authorization": `Bearer ${getJwt()}`,
    },
  });
  return redirect("/monitor");
};

export const loader = async ({
                               params, request
                             }: LoaderFunctionArgs) => {
  const {getSignedIn, getJwt} = await getSessionHandler(request);
  if (!getSignedIn()) return redirect("/signin");
  const name = params.name;
  if (!name) throw new Response("Bad Request", {status: 400});
  const response = await fetch(`${HOST}/cameras/${name}`, {
    headers: {
      "Authorization": `Bearer ${getJwt()}`,
    },
  });
  if (response.ok) {
    const {token} = await response.json();
    return json({name, token, authority: AUTHORITY});
  }
  return redirect("/monitor")
};

export default function Monitor() {
  const {name, token, authority} = useLoaderData<typeof loader>();

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
    if (!socketRef.current) socketRef.current = new WebSocket(`ws://${authority}/ws/monitor?token=${token}`);
    const socket = socketRef.current;
    peerConnectionRef.current = createMonitorPeer(socket, videoRef.current ?? new HTMLVideoElement());
    const peerConnection = peerConnectionRef.current;
    peerConnection.addEventListener("iceconnectionstatechange", () => {
      const state = peerConnection.iceConnectionState;
      console.debug("ICE state changed:", state);
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
      } else if (data.type === "ICE") {
        const ice = JSON.parse(data.payload);
        await peerConnection.addIceCandidate(ice);
      }
    })
    socket.addEventListener("error", (event) => {
      console.error(event);
    });
    socket.addEventListener("close", (event) => {
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
