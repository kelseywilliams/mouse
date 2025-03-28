import express from "express";
import http from "http";
// import https from "https";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import Redis from "ioredis";

// Returns express app and socket
const app = express()
app.use(express.static("public"));
const server = http.createServer(app);
const io = new Server(server);

console.log("Express server on http");
server.listen(3001);
console.log('Express started on port 3001');

// Returns redis client
async function connect(){
    const redis = new Redis(process.env.REDIS_URL, {enableReadyCheck: false});
    return redis;
}

async function getCoords(socket){
    const publisher = await connect();
    socket.on("connection", async (socket) => {
        socket.on("send-coords", async (msg) =>{
            console.log(`Publishing from msg from ${JSON.parse(msg).id}`);
            await publisher.publish("send-coords", msg);
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

// Backburner.  Get something working first.
// async function manager(client, msg) {
//     const NUM_ALLOWED = 10;
//     const msg_json = JSON.parse(msg);
//     const id = msg_json.id;
//     const ttl = msg_json.ttl;

//     // Check if connection is in list of active sessions
//     const isMember = await client.sIsMember("active_ids", id);
//     // If time to live is greater than 15 seconds, remove the sessions
//     if (Date.now() - ttl > 900){
//         await client.sRem("active_ids", id);
//         return;
//     }
//     if (!isMember){
//         // If the connection is not in active sessions, check that length of active_ids
//         //  is less than allowed number of active sessions and add connection id
//         if (await client.sCard("active_ids") < NUM_ALLOWED){
//             client.sAdd("active_ids", id);
//         }

//     }
//     else {
//         // Else go through and
//     }
// }
getCoords(io);
sendCoords(io);

app.get("/", (req, res) => {
    if (err) res.status(500);
    res.status(200);
});