// camera makes peerConnection
export const createCameraPeer = (socket: WebSocket) => {
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
    socket.send(JSON.stringify({ type: "ICE", payload: JSON.stringify(data)}));
  });
  return peerConnection;
};

export const createMonitorPeer = (socket: WebSocket, videoElem: HTMLVideoElement) => {
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
    socket.send(JSON.stringify({ type: "ICE", payload: JSON.stringify(data)}));
  });
  // peerConnection.addEventListener("track", (data) => {
  //   console.debug(data);
  //   // if (!videoElem.srcObject) {
  //   //   videoElem.srcObject = new MediaStream();
  //   // }
  //
  //   // videoElem.srcObject?.addTrack(data.track);
  //   videoElem.videoTracks.addTrack(data.track);
  // });
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
  socket.send(JSON.stringify({ type: "OFFER", payload: JSON.stringify(offer)}));
};

// monitor sends answer
export const sendAnswer = async (socket: WebSocket, offer: RTCSessionDescription, peerConnection: RTCPeerConnection) => {
  console.debug("create answer");
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.send(JSON.stringify({ type: "ANSWER", payload: JSON.stringify(answer)}));
}
