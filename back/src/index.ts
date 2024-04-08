// src/index.js
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from 'cors';
import { PrismaClient } from '@prisma/client'
import { uniqid } from "./utils/utils"
import { deleteOldUserByIp } from "./utils/prismaUtils";

dotenv.config();

const app: Express = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 8080;
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

const prisma = new PrismaClient()

app.get("/", (req: Request, res: Response) => {
  res.send("Secured Whisker");
});

app.post('/register', cors(corsOptions), async (req: Request, res: Response) => {

  const data = req.body
  let ip: string | any = req.headers['x-forwarded-for'] || req.socket.remoteAddress

  await deleteOldUserByIp(ip)

  const uniqUsername = data.username + uniqid()
  try {
    await prisma.user.create({
      data: {
        ip: String(ip),
        uniqId: uniqUsername,
        publicKey: data.publicKey
      }
    })

    console.log("[/register] \t " + data.username + " => " + uniqUsername)
    res.send(uniqUsername)
  } catch (error) {
    res.status(404).send(error)
  }
});

app.get('/getUser', cors(corsOptions), async (req: Request, res: Response) => {
  const data = req.query.name
  const uniqUsername = await prisma.user.findUnique({
    where: {
      uniqId: String(data)
    },
    select: {
      uniqId: true,
      publicKey: true,
    },
  })

  console.log("[/getUser] \t " + data)
  res.send(uniqUsername)
});

app.post('/insertMessage', cors(corsOptions), async (req: Request, res: Response) => {

  const data = req.body

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

  if (userFrom && userTo) {
    await prisma.message.create({
      data: {
        content: data.encryptMessageFor,
        fromId: userFrom.id,
        toId: userTo.id
      }
    })

  console.log("[/insertMessage] " + userFrom.uniqId + " => " + userTo.uniqId)
  
    res.send("Send")
  } else {
    res.send("User not find")
  }

});

app.get('/myMessage', cors(corsOptions), async (req: Request, res: Response) => {

  const data = req.query.name

  const userTo = await prisma.user.findUnique({
    where: {
      uniqId: String(data)
    }
  })

  if (userTo) {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    if (ip !== userTo.ip) {
      res.status(401).send("Wrong user")
    }

    const messages = await prisma.message.findMany({
      where: {
        to: userTo
      },
      include: {
        from: {
          select: {
            uniqId: true
          }
        },
        to: {
          select: {
            uniqId: true
          }
        }
      }
    })

    console.log("[/myMessage] \t " + data + " getting message")
    res.send(messages)
  } else {
    res.status(500).send("Error user not found")
  }


});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});