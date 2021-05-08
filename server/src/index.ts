import express from 'express'

const app: express.Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*")
  res.header("Access-Control-Allow-Headers", "*");
  next();
})

app.listen(3000, () => {
  console.log("Start on port 3000.")
})