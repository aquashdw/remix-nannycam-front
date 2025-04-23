const createPeer = (socket: WebSocket) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
        ],
      },
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

export const createMonitorPeer = (socket: WebSocket, videoElem: HTMLVideoElement) => {
  const peerConnection = createPeer(socket);
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
