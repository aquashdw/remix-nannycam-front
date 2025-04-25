import process from "node:process";

export const iceServerInfo = () => {
  const iceServers = process.env.ICE ?? "stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,stun:stun2.l.google.com:19302,stun:stun3.l.google.com:19302";
  const iceUser = process.env.ICE_USER;
  const icePassword = process.env.ICE_PASSWORD;
// const iceDynamicAuth = process.env.ICE_DYNAMIC === "true";

  return {
    urls: iceServers.split(","),
    username: iceUser,
    credential: icePassword,
  }
}

const createPeer = (socket: WebSocket, iceServer: RTCIceServer) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      iceServer,
    ],
  });
  peerConnection.addEventListener("icecandidate", (data) => {
    console.debug("cam send ice", data);
    socket.send(JSON.stringify({type: "ICE", payload: JSON.stringify(data.candidate)}));
  });
  return peerConnection;
}

// camera makes peerConnection
export const createCameraPeer = createPeer

export const createMonitorPeer = (socket: WebSocket, iceServer: RTCIceServer, videoElem: HTMLVideoElement) => {
  const peerConnection = createPeer(socket, iceServer);
  peerConnection.addEventListener("addstream", (data) => {
    console.debug("addstream");
    console.debug("addstream event", data);
    console.debug(videoElem.srcObject);
    // @ts-expect-error addstream deprecated
    videoElem.srcObject = data.stream;
    console.debug(videoElem.srcObject);
  })
  return peerConnection;
};


// camera create and send offer
export const sendOffer = async (socket: WebSocket, peerConnection: RTCPeerConnection) => {
  console.debug("create offer");
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.send(JSON.stringify({type: "OFFER", payload: JSON.stringify(offer)}));
};

// monitor sends answer
export const sendAnswer = async (socket: WebSocket, offer: RTCSessionDescription, peerConnection: RTCPeerConnection) => {
  console.debug("create answer");
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.send(JSON.stringify({type: "ANSWER", payload: JSON.stringify(answer)}));
}
