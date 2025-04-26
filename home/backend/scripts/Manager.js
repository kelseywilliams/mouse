import dotenv from "dotenv";
dotenv.config();
import Redis from "ioredis";

export default class Manager {
    constructor(socket) {
        this.socket = socket;
        this.redis = new Redis(process.env.REDIS_URL, {enableReadyCheck: false});
        this.MAX_CONN = process.env.MAX_CONN;
        this.alive = "alive";
        this.inactive = "inactive";
        this.dead = "dead";
        this.clock();
    }
    clock() {
        setInterval(() => {
            this.manage();
        }, 1000);
    }
    // Util methods

    // Splits conn json into id and ttl and sanitizes it
    checkIDandTTL(id, ttl){      
        if (!id || !ttl) {
            console.warn(`Warning: id or ttl is undefined. id = ${id} ttl = ${ttl})`);
            return false;
        }
        
        const ttlStr = String(ttl);
        if (!/^\d+$/.test(ttlStr)) {
            console.warn(`Warning: ttl is non-numerical or negative ttl = ${ttl}`);
            return false;
        }
        
        if (id.length !== 20) {
            console.warn(`Warning: id is of unexpected length: ${id.length}`);
            return false;
        }
        
        // all checks passed
        return { id, ttl }
    }

    async manage() {
        const num_conns = await this.redis.hlen(this.alive);
        if (num_conns > this.MAX_CONN){
            throw new Error("Maximum number of concurrent connections exceeded.");
        }

        const obj = await this.redis.hgetall(this.alive);
        for (const [id, ttl] of Object.entries(obj)) {
            const delta = ttl - Date.now();
            // Display countdown
            //console.log(`${id} ${ttl} ${Math.round(delta /1000)} secs`)
            if (delta < 0){
                if(this.remove(id)){
                    console.log(`Removed connection ${id}`);
                }
            }
        }
    }
    async remove(id) {
        const exists = await this.redis.hexists(this.alive, id);
        if (!exists){
            throw new Error(`Attempted to remove connection that does not exist.  id attempted = ${id}.`);
        }
        await this.redis.hdel(this.alive, id);
        const clientSock = this.socket.sockets.sockets.get(id);
        if (clientSock && clientSock.connected){
            this.socket.emit(this.dead, id);
            this.socket.to(id).emit(this.inactive, id);
            return true;
        }
        return false;
    }
    async push(id, ttl){
        if(!this.checkIDandTTL(id, ttl)){
            return false;
        }

        // Look for an existing entry in alive channel
        const exists = await this.redis.hexists(this.alive, id);

        // If this is an existing connection, remove it from the channel and update
        if (exists) {
            await this.redis.hset(this.alive, id, ttl);
            return true;
        } else {
            // If this is a new connection, check if we can accept it

            const count = await this.redis.hlen(this.alive);
            if (count >= this.MAX_CONN){
                console.log(`Cannot push connection to set ${this.alive} because the maximum number of concurrent connections has been reached.`);
            } else {
                await this.redis.hset(this.alive, id, ttl);
                console.log(`User connected ${id}`);
                return true;
            }
        }
        return false;
    }
}