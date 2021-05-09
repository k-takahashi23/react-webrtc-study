import React, { RefObject } from "react";
import io from 'socket.io-client'

type Props = {}

type State = {
  isEnter: boolean
}

export class Video extends React.Component<Props, State> {
  private socket: SocketIOClient.Socket;
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream;
  private localVideoRef: RefObject<HTMLVideoElement>;

  private mediaStreamConstraints: MediaStreamConstraints = {
    audio: true,
    video: true,
  };

  private offerOptions: RTCOfferOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  };

  public constructor(props: Props) {
    super(props)
    this.state = {
      isEnter: false,
    }

    this.localVideoRef = React.createRef<HTMLVideoElement>();

    this.socket = io.connect('http://localhost:3001');
    this.socket.on('RECEIVE_OFFER', this.onRecieveOffer);
    this.socket.on('RECEIVE_ANSWER', this.onRecieveAnswer);
  }
  
  enterRoom = async () => {
    console.log('enterRoom!')

    this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaStreamConstraints)
    if (this.localVideoRef.current) {
      this.localVideoRef.current.srcObject = this.localStream;
    }
    console.log(this.localStream.toString());

    this.peerConnection = new RTCPeerConnection();
    this.peerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
      console.log('onicecandidate!')
    }
    this.peerConnection.ontrack = (ev: RTCTrackEvent) => {
      console.log('ontrack!')
    }

    this.setState({
      isEnter: true,
    })
  }

  callVideo = async () => {
    console.log('callVideo!')
    
    const offer = await this.peerConnection.createOffer(this.offerOptions);
    // // console.log(offer);
    // setOfferState(offer);

    console.log('SEND_OFFER!')
    this.socket.emit('SEND_OFFER', { offer });
  }

  // socket.once('RECEIVE_OFFER', 
  
  onRecieveOffer = async ({ id, offer }: { id: string, offer: RTCSessionDescriptionInit }) => {
    console.log('RECEIVE_OFFER! id=', id);

    // RemoteにOfferをセット
    const receivedOffer = new RTCSessionDescription(offer);
    console.log(receivedOffer)
    await this.peerConnection.setRemoteDescription(receivedOffer);

    // Answerを作って投げつける
    const answer = await this.peerConnection.createAnswer(this.offerOptions);
    // console.log(answer);
    // setAnswerState(answer);

    console.log('SEND_ANSWER!')
    this.socket.emit('SEND_ANSWER', { id, answer });
  };

  onRecieveAnswer = async ({ id, answer }: { id: string, answer: RTCSessionDescriptionInit }) => {
    console.log('RECEIVE_ANSWER! id=', id)

    // RemoteにAnswerをセット
    const receivedAnswer = new RTCSessionDescription(answer)
    console.log(receivedAnswer)
    await this.peerConnection.setRemoteDescription(receivedAnswer);
    console.log('ALL OK!')
  };

  render() {
    const { isEnter } = this.state;
    return (
      <>
        <div>
          <button style={{ width: '100px', height: '50px' }} onClick={this.enterRoom}>Enter</button>
          <button style={{ width: '100px', height: '50px' }} onClick={this.callVideo} disabled={!isEnter}>Call</button>
          <div>{ isEnter.toString() }</div>
          <div style={{ width: '100%', display: 'inline-flex', 'justifyContent': 'center', 'alignItems': 'center' }}>
            <div style={{ width: '50%' }}>
              <h2>You</h2>
              <div style={{ width: '100%' }}>
                <video
                  style={{ marginLeft: '10%', width: '80%' }}
                  ref={this.localVideoRef}
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
                  // ref={remoteVideoRef}
                  playsInline
                  autoPlay
                />
                <audio
                  style={{ display: 'none' }}
                  // ref={remoteAudioRef}
                  controls
                  autoPlay
                />
              </div>
            </div>
          </div>
          {/* <div>
          Offer: 
            <input type="text" style={{ width: '100%', height: '200px' }} value={offerState?.sdp} />
          </div>
          <div>
          Answer: 
            <input type="text" style={{ width: '100%', height: '200px' }} value={answerState?.sdp} />
          </div> */}
        </div>
      </>
    )
  }
}
