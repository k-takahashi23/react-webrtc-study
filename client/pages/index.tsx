import { useEffect, useRef } from "react"

let localStream: MediaStream;
let remoteStream: MediaStream;
let localPeerConnection: RTCPeerConnection;
let remotePeerConnection: RTCPeerConnection;

const offerOptions: RTCOfferOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true,
};

const IndexPage = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    const setStream = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        const videoTracks = localStream.getVideoTracks();
        const audioTracks = localStream.getAudioTracks();

        const configuration = {};
        localPeerConnection = new RTCPeerConnection(configuration);
        remotePeerConnection = new RTCPeerConnection(configuration);
        
        localPeerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
          const iceCandidate = ev.candidate;
          if (iceCandidate) {
            remotePeerConnection
              .addIceCandidate(iceCandidate)
              .then(() => {
                console.log('[localPeer]: addIceCandidate success.')
              })
              .catch(error => {
                console.log(error)
              })
          }
        };

        remotePeerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
          const iceCandidate = ev.candidate;
          if (iceCandidate) {
            remotePeerConnection
              .addIceCandidate(iceCandidate)
              .then(() => {
                console.log('[remotePeer]: addIceCandidate success.')
              })
              .catch(error => {
                console.log(error)
              })
          }
        };

        remotePeerConnection.ontrack = (ev: RTCTrackEvent) => {
          console.log('onTrack')
          remoteStream = new MediaStream()
          console.log(ev.track)
          remoteStream.addTrack(ev.track)
          if (ev.track.kind === 'video') {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream
            }
          }
          if (ev.track.kind === 'audio') {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream
            }
          }
        }

        localPeerConnection.addTrack(videoTracks[0], localStream);
        localPeerConnection.addTrack(audioTracks[0], localStream);

        const offerDescription = await localPeerConnection.createOffer(offerOptions);
        await localPeerConnection.setLocalDescription(offerDescription);
        await remotePeerConnection.setRemoteDescription(offerDescription);

        const answerDescription = await remotePeerConnection.createAnswer();
        await remotePeerConnection.setLocalDescription(answerDescription);
        await localPeerConnection.setRemoteDescription(answerDescription);
        
      } catch (e) {
        console.error(e);
      }
    }

    setStream()
  }, [])
  

  return (
    <>
      <div>
        <video
          style={{ margin: '30px', width: '300px', height: '300px', maxWidth: '100%' }}
          ref={localVideoRef}
          playsInline
          autoPlay
          muted
        />
        <video
          style={{ margin: '30px', width: '300px', height: '300px', maxWidth: '100%' }}
          ref={remoteVideoRef}
          playsInline
          autoPlay
        />
        <audio
          style={{ display: 'none' }}
          ref={remoteAudioRef}
          controls
          autoPlay
        />
      </div>
    </>
  )
}

export default IndexPage
