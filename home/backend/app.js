import express from "express";
import http from "http";
// import https from "https";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import Redis from "ioredis";
import Manager from "./scripts/Manager.js"

// Returns express app and socket
const app = express()
app.use(express.static("frontend"));
const server = http.createServer(app);
const socket = new Server(server);

console.log("Express server on http");
server.listen(3001);
console.log('Express started on port 3001');

const manager = new Manager(socket);

// Returns redis client
async function connect(){
    try {
        const redis = new Redis(process.env.REDIS_URL, {enableReadyCheck: false});
        redis.select(0);
        return redis;
    } catch(e){
        throw new Error(e);
    }

}

async function handler (socket){
    const publisher = await connect();
    const subscriber = await connect();
    socket.on("connection", async (socket) => {
        socket.on("send-coords", async (msg) =>{
            const obj = JSON.parse(msg);
            const id = obj.id;
            const ttl = obj.ttl;
            if (await manager.push(id, ttl)){
                console.log(`Updated ${id}`);
                await publisher.publish("send-coords", msg);
            }
        });
        subscriber.subscribe("send-coords", (err, count) => {
            if (err){
                console.log("Error subscribing to send-coords: " + err);
            } else {
                console.log(`Subscribed to send-coords.`);
            }
        });
        subscriber.on("message", (channel, msg) => {
            if (channel == "send-coords"){
                const id = JSON.parse(msg).id;
                socket.except(id).emit("get-coords", msg);
            }
        });
    });
    socket.on("disconnect", () => {
        subscriber.unsubscribe("send-coords");
        subscriber.quit();
        publisher.quit();
    })
}

await handler(socket);

app.get("/", (req, res) => {
    if (err) res.status(500);
    res.status(200);
});