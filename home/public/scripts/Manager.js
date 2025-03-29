import dotenv from "dotenv";
dotenv.config();
import Redis from "ioredis";

export default class Manager {
    constructor(socket) {
        this.socket = socket;
        this.redis = new Redis(process.env.REDIS_URL, {enableReadyCheck: false});
        this.MAX_CONN = 10;
        this.TTL = 15;
        this.alive = "alive";
        this.inactive = "inactive";
        this.clock();
    }
    clock() {
        setInterval(() => {
            this.manage();
        }, 1000);
    }
    async manage() {
        if (this.redis.scard(this.alive) > this.MAX_CONN){
            throw new Error("Maximum number of concurrent connections exceeded.");
        }
        let cursor = 0;
        do {
            const [next, conns] = await this.redis.sscan(this.alive, cursor);
            conns.forEach(conn => {
                if (Date.now() - JSON.parse(conn).ttl > this.TTL){
                    if(this.remove(conn)){
                        console.log(`Removed connection ${conn}`);
                    }
                }
            })
            cursor = next;
        } while (cursor != 0);
    }
    remove(conn) {
        if (!JSON.parse(conn).id) {
            console.log("Missing key id. Returning false");
        }
        if (!this.redis.sismember(this.alive, conn)){
            throw new Error(`Validate method attempted to remove connection that is not part of ${this.active} set.`);
        }
        this.redis.srem(this.alive, conn);
        const id = JSON.parse(conn).id;
        const clientSock = this.socket.sockets.sockets.get(id);
        if (clientSock && clientSock.connected){
            this.socket.to(id).emit(this.inactive, id);
            clientSock.disconnect();
            return true;
        }
        return false;
    }
    async push(conn){
        if (!JSON.parse(conn).id) {
            console.log("Missing id key. Returning false.");
        }
        const ismember = await this.redis.sismember(this.active, conn);
        if (ismember){
            console.log(`Cannot push connection to set ${this.active} because the connection is already a member of set ${this.active}.`);
        }
        if (this.redis.scard(this.alive) >= this.MAX_CONN){
            console.log(`Cannot push connection to set ${this.active} because the maximum number of concurrent connections has been reached.`);        }
        this.redis.sadd(this.alive, conn);
        if (this.redis.sismember(this.alive, conn)) return true;
        return false;
    }
    async update(conn){
        const id = JSON.parse(conn).id
        if (!JSON.parse(conn).id) {
            console.log("Missing key id. Returning false.");
            return false;
        }
        if (this.redis.sismember(this.active, conn)){
            try{
                this.redis.srem(this.active, conn);
                this.redis.sadd(this.active, conn);
                return true;
            } catch(err){
                console.log(`Failed to update connection ${id}.  ${err}`);
            }
        }  else {
            console.log(`Connection ${id} is not a member of set ${this.alive}`)
        }
        return false;
    }
}