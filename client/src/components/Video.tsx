import React, { RefObject } from "react";
import io from 'socket.io-client'

type Props = {}

type State = {
  isEnter: boolean
  offerState: string | undefined,
  answerState: string | undefined,
}

export class Video extends React.Component<Props, State> {
  private socket: SocketIOClient.Socket;
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream;
  private remoteStream: MediaStream;
  private localVideoRef: RefObject<HTMLVideoElement>;
  private remoteVideoRef: RefObject<HTMLVideoElement>;

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
      offerState: undefined,
      answerState: undefined,
    }

    // 画面出力用のRef
    this.localVideoRef = React.createRef<HTMLVideoElement>();
    this.remoteVideoRef = React.createRef<HTMLVideoElement>();

    // socket.io を使ったシグナリングサーバーとの通信設定
    this.socket = io.connect('http://localhost:3001');
    this.socket.on('RECEIVE_OFFER', this.onRecieveOffer);
    this.socket.on('RECEIVE_ANSWER', this.onRecieveAnswer);
    this.socket.on('RECEIVE_ICE', this.onReceiveIce);
  }
  
  enterRoom = async () => {
    console.log('enterRoom!')

    // 入室したら自分のビデオを自分の画面に映す
    this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaStreamConstraints)
    if (this.localVideoRef.current) {
      this.localVideoRef.current.srcObject = this.localStream;
    }

    // PeerConnection を作成
    this.peerConnection = new RTCPeerConnection();

    // PeerConnection にあらかじめイベントを設定
    this.peerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
      console.log('onicecandidate!', ev.candidate)

      // Ice を送信
      const iceCandidate = ev.candidate;
      if (iceCandidate) this.sendIce(iceCandidate);
    }
    this.peerConnection.ontrack = (ev: RTCTrackEvent) => {
      console.log('ontrack!')

      // 送られてきたTrack をStream に加工
      this.remoteStream = new MediaStream()
      this.remoteStream.addTrack(ev.track)

      // 相手のビデオを相手の画面に映す
      if (ev.track.kind === 'video') {
        if (this.remoteVideoRef.current) {
          this.remoteVideoRef.current.srcObject = this.remoteStream
        }
      }
    }

    this.setState({
      isEnter: true,
    })
  }

  callVideo = async () => {
    console.log('callVideo!')

    // ローカルのビデオトラックをPeerConnection に追加する（この時点ではまだ相手に映像は見えない）
    const videoTracks = this.localStream.getVideoTracks();
    this.peerConnection.addTrack(videoTracks[0], this.localStream);
    
    // Offer を作成してローカルにセット (PreOffer)
    const offer = await this.peerConnection.createOffer(this.offerOptions);
    this.setState({
      offerState: offer.sdp,
    })
    this.peerConnection.setLocalDescription(offer);

    // Offer を送信する
    console.log('SEND_OFFER!')
    this.socket.emit('SEND_OFFER', { offer });
  }
  
  onRecieveOffer = async ({ id, offer }: { id: string, offer: RTCSessionDescriptionInit }) => {
    console.log('RECEIVE_OFFER! id=', id);

    // Offer を受け取ってリモートにセット
    const receivedOffer = new RTCSessionDescription(offer);
    console.log(receivedOffer)
    this.setState({
      offerState: receivedOffer.sdp,
    })
    await this.peerConnection.setRemoteDescription(receivedOffer);

    // Answer を作成してローカルにセット (PreAnswer)
    const answer = await this.peerConnection.createAnswer(this.offerOptions);
    console.log('SEND_ANSWER!')
    this.setState({
      answerState: answer.sdp,
    })
    await this.peerConnection.setLocalDescription(answer);

    // Answer を返す
    this.socket.emit('SEND_ANSWER', { id, answer });
  };

  onRecieveAnswer = async ({ id, answer }: { id: string, answer: RTCSessionDescriptionInit }) => {
    console.log('RECEIVE_ANSWER! id=', id)

    // Answer を受け取ってリモートにセット
    const receivedAnswer = new RTCSessionDescription(answer)
    console.log(receivedAnswer)
    this.setState({
      answerState: receivedAnswer.sdp,
    })
    await this.peerConnection.setRemoteDescription(receivedAnswer);
  };

  sendIce = (iceCandidate: RTCIceCandidate) => {
    console.log('sendIce!');

    // Ice を送信する
    this.socket.emit('SEND_ICE', { ice: iceCandidate })
  }

  onReceiveIce = async ({ ice }: { ice: RTCIceCandidate }) => {
    console.log('onReceiveIce!');

    // Ice を受け取ったらPeerConnection に追加する
    await this.peerConnection.addIceCandidate(ice);
  }

  render() {
    const { isEnter, offerState, answerState } = this.state;
    return (
      <>
        <div>
          <button style={{ width: '100px', height: '50px' }} onClick={this.enterRoom}>Enter</button>
          <button style={{ width: '100px', height: '50px' }} onClick={this.callVideo} disabled={!isEnter}>Call</button>
          <div>{ isEnter ? '入室中' : '未入室' }</div>
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
                  ref={this.remoteVideoRef}
                  playsInline
                  autoPlay
                  muted
                />
              </div>
            </div>
          </div>
          <div>
            <h4>Offer</h4>
            <div style={{ width: '100%', height: '1000px', fontSize: '8px' }}>{offerState}</div>
          </div>
          <div>
            <h4>Answer</h4>
            <div style={{ width: '100%', height: '1000px', fontSize: '8px' }}>{answerState}</div>
          </div>
        </div>
      </>
    )
  }
}
