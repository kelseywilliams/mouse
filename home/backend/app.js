import express from "express";
import http from "http";
// import https from "https";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import Redis from "ioredis";
import Manager from "./scripts/Manager.js"
import validator from "validator";

// Returns express app and socket
const app = express()
app.use(express.json());
app.use(express.static("frontend"));
const server = http.createServer(app);
const socket = new Server(server);

server.listen(3001);
console.log("Express server on http on port 3001");

async function connect(){
    const redis = new Redis(process.env.REDIS_URL, {enableReadyCheck: false});
    redis.select(0);
    redis.on('error', err => {
        console.warn('A fatal error occured while trying to connect to the database.  (Is it on?)')
        process.exit(1);
    })
    return redis;
}


async function handler (socket){
    const manager = new Manager(socket, await connect());
    const publisher = await connect();
    const subscriber = await connect();
    subscriber.subscribe("data", (err) => {
        if (err){
            console.log("Error subscribing to redis channel: data: " + err);
        }
    });
    subscriber.on("message", (channel, msg) => {
        if (channel == "data"){
            const id = JSON.parse(msg).id;
            socket.except(id).emit("get-data", msg);
        }
    });
    let timeout = 60000 // give the user 60 seconds to input before disconnect
    socket.on("connection", async (socket) => {
        manager.push(socket.id, Date.now() + timeout)
        socket.on("send-data", async (msg) =>{
            let obj;
            try {
              obj = JSON.parse(msg);
            } catch (e) {
                throw new Error("Invalid object type recieved by server.");
            }
          
            // pull out fields
            const { id, x, y, ttl, name } = obj;
          
            // coerce to numbers & check
            const sx  = Number(x);
            const sy  = Number(y);
            const st  = Number(ttl);
            if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(st)) {
              throw new Error("Invalid data received by server.")
              return;
            }
          
            // sanitize the other bits
            const sid   = String(id);
            const sname = (name !== undefined) ? validator.escape(name) : undefined;
          
            if (await manager.push(sid, st)) {
              // only publish the cleaned payload
              const clean = { id: sid, x: sx, y: sy, ttl: st, name: sname };
              await publisher.publish("data", JSON.stringify(clean));
            }
        });
        socket.on("name", async (name) => {
            if (name != ""){
                const clean_name = validator.escape(name);
                socket.emit("set-name", clean_name);
            }

        });

        socket.on("disconnect", async () => {
            await manager.push(socket.id, 0);
            await manager.manage();
            socket.broadcast.emit("dead", socket.id);
        });
    });
}

await handler(socket);

// app.post("/api/name", async (req, res) => {
//     let { id, name } = req.body;
//     const cleanId = validator.escape(id);
//     const cleanName = validator.escape(name);
//     let redis = await connect();
//     redis.
// });
app.get("/", (req, res) => {
    if (err) res.status(500);
    res.status(200);
});