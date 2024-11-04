import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, json, useBeforeUnload, useLoaderData, useSubmit } from "@remix-run/react";
import { getSession } from "~/lib/session";
import { useEffect, useRef } from "react";

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

  const submit = useSubmit();
  useBeforeUnload(() => {
    submit(new FormData(),{method: "post"})
  });

  const videoRef = useRef<HTMLVideoElement>();
  let cameraStream: MediaStream;

  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === "videoinput");
      const currentCamera = cameraStream.getVideoTracks()[0];
      cameras.forEach(camera => {
        const option = document.createElement("option");
        option.value = camera.deviceId;
        option.innerText = camera.label;
        if (currentCamera.label === camera.label) {
          option.selected = true;
        }
        console.log(option);
      })
    } catch (e) {
      console.error(e);
    }
  };

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
      if (videoRef.current) videoRef.current.srcObject = cameraStream
      if (!videoId) await getCameras();
    } catch (e) {
      console.error(e);
    }
  };

  const init = async () => {
    await getMedia();
  }

  useEffect(() => {
    init().then(() => {
      const socket = new WebSocket(`ws://localhost:8080/ws/camera?token=${token}`);
      socket.addEventListener("message", (event) => {
        console.log(event.data);
        socket.send("camera ack");
      })
      socket.addEventListener("error", (event) => {
        console.error(event);
      });
      socket.addEventListener("close", (event) => {
        console.log(event);
      });
    });
  }, []);
  return (
    <main>
      <div className="main-content-centered">
        <h1 className="mb-4">Camera {name}</h1>
        {/*
        // @ts-expect-error ref types mismatch */}
        <video ref={videoRef} autoPlay={true} playsInline={true} className="min-w-full min-h-full">
        <track kind="captions"/>
        </ video>
        <Form method="post">
          <input type="submit" value="Remove Camera"/>
        </Form>
      </div>
    </main>
  )
}
