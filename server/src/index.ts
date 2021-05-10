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

const server = app.listen(portServer, () => {
  console.log(`Start server on port ${portServer}.`)
})

const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

io.on('connection', socket => {
  console.log('socket.id:' + socket.id);

  socket.on('SEND_OFFER', ({ offer }: { offer: RTCSessionDescriptionInit }) => {
    console.log('SEND_OFFER!');
    socket.broadcast.emit('RECEIVE_OFFER', { offer });
  })

  socket.on('SEND_ANSWER', ({ answer }: { answer: RTCSessionDescriptionInit }) => {
    console.log('SEND_ANSWER!', socket.id);
    socket.broadcast.emit('RECEIVE_ANSWER', { answer });
  })

  socket.on('SNED_ICE', ({ ice }: { ice: RTCIceCandidate }) => {
    console.log('SEND_ICE!')
    socket.broadcast.emit('RECEIVE_ICE', { ice });
  })
})