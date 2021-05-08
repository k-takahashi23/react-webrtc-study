import { useRef } from "react"
import io from 'socket.io-client'

let localStream: MediaStream;
let remoteStream: MediaStream;
let localPeerConnection: RTCPeerConnection;
let remotePeerConnection: RTCPeerConnection;

const offerOptions: RTCOfferOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true,
};

const IndexPage = (): JSX.Element => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const connectVideo = async () => {
    try {
      // Get localStream by getUserMedia()
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

      // Set videoRef
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // Create local and remote PeerConnections
      const configuration = {};
      localPeerConnection = new RTCPeerConnection(configuration);
      remotePeerConnection = new RTCPeerConnection(configuration);
      
      // Set local onicecandidate events
      localPeerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
        const iceCandidate = ev.candidate;
        if (iceCandidate) remotePeerConnection.addIceCandidate(iceCandidate);
      };

      // Set remote onicecandidate events
      remotePeerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
        const iceCandidate = ev.candidate;
        if (iceCandidate) remotePeerConnection.addIceCandidate(iceCandidate);
      };

      // Set remote ontrack event
      remotePeerConnection.ontrack = (ev: RTCTrackEvent) => {
        remoteStream = new MediaStream()
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

      // Add video and audio tracks
      const videoTracks = localStream.getVideoTracks();
      const audioTracks = localStream.getAudioTracks();
      localPeerConnection.addTrack(videoTracks[0], localStream);
      localPeerConnection.addTrack(audioTracks[0], localStream);

      // Offer from local
      const offerDescription = await localPeerConnection.createOffer(offerOptions);
      await localPeerConnection.setLocalDescription(offerDescription);
      await remotePeerConnection.setRemoteDescription(offerDescription);

      // Answer from remote
      const answerDescription = await remotePeerConnection.createAnswer();
      await remotePeerConnection.setLocalDescription(answerDescription);
      await localPeerConnection.setRemoteDescription(answerDescription);
    } catch (e) {
      console.error(e);
    }
  }

  const handleClick = () => {
    const socket = io('localhost:3001');
    socket.emit('message', 'Hello from client!');
    connectVideo();
  }

  return (
    <>
      <div>
        <button style={{ width: '100px', height: '50px' }} onClick={handleClick}>Call</button>
        <div style={{ width: '100%', display: 'inline-flex', 'justifyContent': 'center', 'alignItems': 'center' }}>
          <div style={{ width: '50%' }}>
            <h2>You</h2>
            <div style={{ width: '100%' }}>
              <video
                style={{ marginLeft: '10%', width: '80%' }}
                ref={localVideoRef}
                playsInline
                autoPlay
                muted
              />
            </div>
          </div>
          <div style={{ width: '50%' }}>
            <h2>Friend</h2>
            <div>
              <video
                style={{ marginLeft: '10%', width: '80%' }}
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
          </div>
        </div>
      </div>
    </>
  )
}

export default IndexPage
