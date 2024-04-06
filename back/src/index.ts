// src/index.js
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from 'body-parser';
import cors from 'cors';
import { PrismaClient, User } from '@prisma/client'
import { uniqid } from "./utils/utils"
import { create } from "domain";


dotenv.config();

const app: Express = express();
app.use(cors())
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 8080;
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

const prisma = new PrismaClient()

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.post('/register', cors(corsOptions), async (req: Request, res: Response) => {

  const data = req.body
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  console.log(data)
  const uniqUsername = data.username + uniqid()
  await prisma.user.create({
    data: {
      ip: String(ip),
      uniqId: uniqUsername,
      publicKey: data.publicKey
    }
  })

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(uniqUsername)
});

app.get('/getUser', cors(corsOptions), async (req: Request, res: Response) => {

  const data = req.query.name
  const uniqUsername = await prisma.user.findUnique({
    where: {
      uniqId: String(data)
    }
  })

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(uniqUsername)
});

app.post('/insertMessage', cors(corsOptions), async (req: Request, res: Response) => {

  const data = req.body
  console.log(data)

  const userFrom = await prisma.user.findUnique({
    where: {
      uniqId: data.from
    }
  })

  const userTo = await prisma.user.findUnique({
    where: {
      uniqId: data.to
    }
  })

  console.log(userFrom)
  console.log(userTo)

  if (userFrom && userTo) {
    const addImage = await prisma.message.create({
      data: {
        content: data.encryptMessageFor,
        fromId: userFrom.id,
        toId: userTo.id
      }
    })

    res.send("send")

  } else {
    res.send("User not find")

  }



});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});