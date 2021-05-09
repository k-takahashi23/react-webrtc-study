import express from 'express'
import { Server } from 'socket.io'

const portServer = 3001;

const app: express.Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*")
  res.header("Access-Control-Allow-Headers", "*");
  next();
})


// app.get('/', (_req: express.Request, res: express.Response) => {
//   res.send(JSON.stringify('Hello World!'))
// })

const server = app.listen(portServer, () => {
  console.log(`Start server on port ${portServer}.`)
})

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  }
});

// const roomName = 'myRoom';
io.on('connection', socket => {
  console.log('socket.id:' + socket.id);

  socket.on('SEND_OFFER', ({ offer }: { offer: RTCSessionDescriptionInit }) => {
    console.log('SEND_OFFER!', socket.id);
    socket.broadcast.emit('RECEIVE_OFFER', { id: socket.id, offer });
    // socket.emit('RECEIVE_OFFER', { offer });
  })

  socket.on('SEND_ANSWER', ({ id, answer }: { id: string, answer: RTCSessionDescriptionInit }) => {
    console.log('SEND_ANSWER!', socket.id);
    socket.broadcast.emit('RECEIVE_ANSWER', { id, answer });
    // socket.emit('RECEIVE_ANSWER', { answer });
  })

  // socket.on('SEND_ENTER', (_data: { roomName: string }) => {
  //   // const { roomName } = data;
  //   console.log('SEND_ENTER!', roomName);
  //   socket.join(roomName);
  //   // console.log('roomName is ', socket.rooms.values().next().value)
  //   // console.log('rooms', socket.rooms)
  //   socket
  //     .broadcast
  //     .to(roomName)
  //     .emit('RECEIVE_CALL', { id: socket.id })
  // })
  
  // socket.on('SEND_CALL', () => {
  //   console.log('SEND_CALL!');
  //   console.log(socket.rooms.values())
  //   socket
  //     .broadcast
  //     .to(roomName)
  //     .emit('RECEIVE_CALL', { id: socket.id })
  // })

  // socket.on('SEND_CANDIDATE', (data: { id: string, ice: RTCIceCandidate }) => {
  //   console.log('SEND_CANDIDATE! id=', data.id, ', ice=', data.ice);
  //   const { id, ice } = data;
  //   socket
  //     .broadcast
  //     .to(roomName)
  //     .emit('RECEIVE_CANDIDATE', { id, ice });
  // })

  // socket.on('SEND_SDP', (data: { id: string, sdp: RTCSessionDescription }) => {
  //   const { id, sdp } = data;
  //   console.log('SEND_SDP! id=', data.id, 'sdp.type', sdp.type);
  //   socket
  //     .broadcast
  //     .to(roomName)
  //     .emit('RECEIVE_SDP', { id, sdp });
  // })
})