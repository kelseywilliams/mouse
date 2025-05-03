import dotenv from "dotenv";
dotenv.config();
import Redis from "ioredis";

export default class Manager {
    constructor(socket, redis) {
        this.socket = socket;
        this.redis = redis;
        this.MAX_CONN = process.env.MAX_CONN;
        this.RECENTLY_RM_BUFF = process.env.REMOVE_RM_BUFF;
        // Define channels.  Idk why I did it like this.  
        // Maybe I'll go back to being normal
        this.alive = "alive";
        this.inactive = "inactive";
        this.dead = "dead";
        this.recently_rm = "recently_rm";
        this.num_conns = "num_conns";
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
        let num_conns = await this.redis.hlen(this.alive);
        if (num_conns > this.MAX_CONN){
            throw new Error("Maximum number of concurrent connections exceeded.");
        }
        this.socket.emit(this.num_conns, num_conns);

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
        const exists_in_alive = await this.redis.hexists(this.alive, id);
        // Keeping a set of recently deleted IDs is necessary for conflict resolution
        const exists_in_recently_rm = await this.redis.sismember(this.recently_rm, id);
        if (!exists_in_alive){
            if (!exists_in_recently_rm){
                throw new Error(`Attempted to remove connection that does not exist.  id attempted = ${id}.`);
            } else {
                console.log("Attemped to remove an id twice.  Conflict handled peacefully.")
                // housekeeping.  Don't let the recently deleted get too large
                const count = await this.redis.scard(this.recently_rm);
                if (count > this.RECENTLY_RM_BUFF){
                    await this.redis.srem(this.recently_rm, id);
                }
                return true;
            }
        } 
        await this.redis.hdel(this.alive, id);
        const clientSock = this.socket.sockets.sockets.get(id);
        if (clientSock && clientSock.connected){
            this.socket.emit(this.dead, id);
            this.socket.to(id).emit(this.inactive, id);
            await this.redis.sadd(this.recently_rm, id);
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