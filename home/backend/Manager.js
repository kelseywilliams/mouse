import dotenv from "dotenv";
dotenv.config();
import logger from "./logger.js";
import validator from "validator";

export default class Manager {
    constructor(socket, redis) {
        this.socket = socket;
        this.redis = redis;
        this.MAX_CONN = process.env.MAX_CONN;
        this.clock();
    }
    clock() {
        setInterval(() => {
            this.manage();
        }, 1000);
    }

    async manage() {
        let num_conns = await this.redis.hlen("alive");
        if (num_conns > this.MAX_CONN){
            throw new Error("Maximum number of concurrent connections exceeded.");
        }
        this.socket.emit("num_conns", num_conns);

        const obj = await this.redis.hgetall("alive");
        for (const [id, ttl] of Object.entries(obj)) {
            const delta = ttl - Date.now();
            // Display countdown
            //logger.info(`${id} ${ttl} ${Math.round(delta /1000)} secs`)
            if (delta < 0){
                if(this.remove(id)){
                    logger.info(`Removed connection ${id}`);
                }
            }
        }
    }
    async remove(id) {
        if (id === undefined){
            logger.warn(`Warning: id or ttl is undefined. id = ${id}`);
            return false;
        }
        const exists_in_alive = await this.redis.hexists("alive", id);
        if (!exists_in_alive){
            logger.error("Attempted to remove an id that does not exist.");
            throw new Error("User does not exist");
        } 
        await this.redis.hdel("alive", id);
        const clientSock = this.socket.sockets.sockets.get(id);
        if (clientSock && clientSock.connected){
            this.socket.emit("dead", id);
            this.socket.to(id).emit("inactive", id);
            return true;
        }
        return false;
    }
    async push(id, ttl){
        if (id === undefined){
            logger.warn(`Warning: id or ttl is undefined. id = ${id}`);
            return false;
        }
        // Look for an existing entry in alive channel
        const exists = await this.redis.hexists("alive", id);

        // If this is an existing connection, remove it from the channel and update
        if (exists) {
            await this.redis.hset("alive", id, ttl);
            return true;
        } else {
            // If this is a new connection, check if we can accept it

            const count = await this.redis.hlen("alive");
            if (count >= this.MAX_CONN){
                logger.warn(`Cannot push connection to set ${"alive"} because the maximum number of concurrent connections has been reached.`);
            } else {
                await this.redis.hset("alive", id, ttl);
                logger.info(`User connected ${id}`);
                return true;
            }
        }
        return false;
    }
}