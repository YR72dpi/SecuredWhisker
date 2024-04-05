// src/index.js
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from 'body-parser';
import cors from 'cors';
import { PrismaClient } from '@prisma/client'
import { uniqid } from "./utils/utils"


dotenv.config();

const app: Express = express();
app.use(cors())
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
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

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});