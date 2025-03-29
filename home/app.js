import express from "express";
import http from "http";
// import https from "https";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import Redis from "ioredis";
import Manager from "./public/scripts/Manager.js"

// Returns express app and socket
const app = express()
app.use(express.static("public"));
const server = http.createServer(app);
const io = new Server(server);

console.log("Express server on http");
server.listen(3001);
console.log('Express started on port 3001');

manager = new Manager(io);

// Returns redis client
async function connect(){
    const redis = new Redis(process.env.REDIS_URL, {enableReadyCheck: false});
    return redis;
}

async function getCoords(socket){
    const publisher = await connect();
    socket.on("connection", async (socket) => {
        socket.on("send-coords", async (msg) =>{
            const msg_json = JSON.parse(msg);
            const id = msg_json.id;
            const ttl = msg_json.ttl;
            const conn = {id: id, ttl: ttl};
            if (await manager.push(JSON.stringify(conn))){
                if(manager.update(JSON.stringify(conn))){
                    console.log(`Updated ${id}`);
                };
                console.log(`Publishing from msg from ${id}`);
                await publisher.publish("send-coords", msg);
            }
        });
    });

}

async function sendCoords(socket){
    const subscriber = await connect();
    subscriber.subscribe("send-coords", (err, count) => {
        if (err){
            console.log("Error subscribing to send-coords: " + err);
        } else {
            console.log(`Subscribed to send-coords.`);
        }
    });
    subscriber.on("message", (channel, msg) => {
        if (channel == "send-coords"){
                socket.emit("get-coords", msg);
        }
    })
}

getCoords(io);
sendCoords(io);

app.get("/", (req, res) => {
    if (err) res.status(500);
    res.status(200);
});