import { useEffect } from 'react';
import io from 'socket.io-client'

const SocketPage = (): JSX.Element => {
  
  useEffect(() => {
    // const socket = io('localhost:3001');
    // socket.emit('message', 'Hello from client!')
  }, [])

  return (
    <>
      <div>
        Hello World!
        <button onClick={() => {
          const socket = io('localhost:3001');
          socket.emit('message', 'Hello from client!')
        }}>AAA</button>
      </div>
    </>
  )
}

export default SocketPage
