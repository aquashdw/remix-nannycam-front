import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import {Form, json, useBeforeUnload, useLoaderData, useNavigate, useSubmit} from "@remix-run/react";
import { getSession } from "~/lib/session";
import { useEffect, useRef } from "react";
import { createCameraPeer, sendOffer } from "~/lib/rtc";

export const action = async({
                              params, request
                            }: ActionFunctionArgs) => {
  const session = await getSession(request);
  if (!session.get("signedIn")) return redirect("/signin");
  const name = params.name;
  if (!name) throw new Response("Bad Request", { status: 400 });
  await fetch(`http://localhost:8080/cameras/${name}`, {
    method: "delete",
    headers: {
      "Authorization": `Bearer ${session.get("jwt")}`,
    },
  });
  return redirect("/");
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
  return redirect("/camera/new?invalid=error")
};

export default function Camera() {
  const { name, token } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>();
  const selectRef = useRef<HTMLSelectElement>();
  const socketRef = useRef<WebSocket>();
  const peerConnectionRef = useRef<RTCPeerConnection>();

  let cameraStream: MediaStream;

  const onExit = () => {
    peerConnectionRef.current?.close();
    cameraStream?.getTracks().forEach(track => {
      track.stop();
    });
  }

  const submit = useSubmit();
  useBeforeUnload(() => {
    onExit();
    // submit(new FormData(), {method: "post"});
  });

  const getCameras = async () => {
    if (!selectRef.current) return;
    const cameraSelect = selectRef.current;
    try {
      cameraSelect.innerHTML = '';
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === "videoinput");
      const currentCamera = cameraStream.getVideoTracks()[0];
      cameras.forEach(camera => {
        const option = document.createElement("option");
        option.value = camera.deviceId;
        option.innerText = camera.label;
        option.selected = currentCamera.label === camera.label;
        cameraSelect.appendChild(option);
      });
      cameraSelect.addEventListener("input", async (e: Event) => {
        // @ts-expect-error value not found on target when it should
        await getMedia(e.target.value);
        const peerConnection = peerConnectionRef.current;
        if (peerConnection) {
          const track = cameraStream.getVideoTracks()[0];
          const sender = peerConnection.getSenders()
              .find(sender => sender.track?.kind === "video");
          await sender?.replaceTrack(track);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  const getMedia = async (videoId: string | null = null) => {
    try {
      const initConstraints = {
        audio: {
          muted: true,
        },
        video: {
          facingMode: "user",
        },
      };
      const cameraConstraints = {
        audio: {
          muted: true,
        },
        video: {
          deviceId: {
            exact: videoId
          }
        },
      }
      cameraStream = await navigator.mediaDevices.getUserMedia(
          // @ts-expect-error TODO
          videoId ? cameraConstraints : initConstraints
      );
      cameraStream.getAudioTracks().forEach(track => track.enabled = false);
      if (videoRef.current) videoRef.current.srcObject = cameraStream
      if (!videoId) await getCameras();
    } catch (e) {
      console.error(e);
    }
  };

  const init = async () => {
    await getMedia();
  }

  const connectSignal = () => {
    let peerConnection: RTCPeerConnection;
    socketRef.current = new WebSocket(`ws://localhost:8080/ws/camera?token=${token}`);
    const socket = socketRef.current;
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== "ICE") console.debug(data);
      if (data.type === "CONNECT") {
        console.debug("monitor connected");
        peerConnectionRef.current = createCameraPeer(socket);
        peerConnection = peerConnectionRef.current;
        peerConnection.addEventListener('iceconnectionstatechange', () => {
          const state = peerConnection.iceConnectionState;
          console.debug('ICE state changed:', state);
          if (state === "connected" || state === "completed") {
            socket.close();
          }
          if (state === "disconnected" || state === "closed" || state === "failed") {
            connectSignal();
          }
        })
        cameraStream.getTracks().forEach(track => peerConnection.addTrack(track, cameraStream));
        sendOffer(socket, peerConnection);
      }
      else if (data.type === "ANSWER") {
        console.debug("get answer");
        const answer = JSON.parse(data.payload);
        console.debug(peerConnection.remoteDescription);
        if(!peerConnection.remoteDescription)
          peerConnection.setRemoteDescription(answer);
      }
      else if (data.type === "ICE") {
        console.debug("ICE!!!");
        const ice = JSON.parse(data.payload);
        peerConnection.addIceCandidate(ice);
      }
    });
    socket.addEventListener("error", (event) => {
      console.error(event);
    });
    socket.addEventListener("close", (event) => {
      console.log(event);
      if (event.code === 1008) {
        alert(event.reason);
        navigate("/camera/new");
      }
    });
  }

  useEffect(() => {
    connectSignal();
    init().then(() => console.debug("camera added"));
  }, []);

  return (
      <main>
        <div className="main-content-centered">
          <h1 className="mb-4">Camera {name}</h1>
          {/*
        // @ts-expect-error ref types mismatch */}
          <video ref={videoRef} autoPlay={true} playsInline={true} className="min-w-full min-h-full mb-2" muted={true}>
            <track kind="captions"/>
          </ video>
          <div className="flex justify-center">
            {/*
        // @ts-expect-error ref types mismatch */}
            <select ref={selectRef} className="text-lg rounded-md border-0 py-2 px-3 bg-gray-50 text-black" id="camera-select">

            </select>
            <div className="mx-1"></div>
            <Form method="post" onSubmit={(event) => {
              onExit();
              submit(event.currentTarget);
            }}>
              <input type="submit" value="Remove Camera"/>
            </Form>
          </div>
        </div>
      </main>
  )
}
