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


app.get('/', (_req: express.Request, res: express.Response) => {
  res.send(JSON.stringify('Hello World!'))
})

const server = app.listen(portServer, () => {
  console.log(`Start server on port ${portServer}.`)
})

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  }
});

io.on('connection', socket => {
  console.log(socket.id);

  socket.on('message', (data) => {
    console.log(data)
  });
})