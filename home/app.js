const express = require("express")
const http = require("http");
const https = require("https");
const fs = require("fs");
const dotenv = require("dotenv").config();
const { Server } = require('socket.io');

const app = express();
var server;
if (process.env.NODE_ENV === "production") {
    var key = fs.readFileSync("/etc/letsencrypt/live/kelseywilliams.co/privkey.pem");
    var cert = fs.readFileSync("/etc/letsencrypt/live/kelseywilliams.co/fullchain.pem");
    var options = {
        key: key,
        cert: cert
    };

    server = createServer(options, app);
    console.log("Express server on https");
} else {
    server = createServer(app);
    console.log("Express server on http");
}
server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
    if (err) res.status(500);
    res.status(200);
});

server.listen(3001);

console.log('Express started on port 3001');