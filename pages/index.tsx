import { useEffect, useRef } from "react"

const IndexPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    const setVideoStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }

    const setAudioStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
      }
    }

    setVideoStream();
    setAudioStream();
  }, [])
  

  return (
    <>
      <div>
        <video
          style={{ width: '300px', height: '300px', maxWidth: '100%' }}
          ref={videoRef}
          autoPlay
          playsInline
        />
        <audio
          ref={audioRef}
          controls
          // autoPlay
        />
      </div>
    </>
  )
}

export default IndexPage
