class Client {
    constructor(){
        this.socket = io();
        this.TIMEOUT = 30000;
        this.connected = false;
        this.MiceManager = new MiceManager();
        this.clock();
    }
    clock() {
        setInterval(() => {
            if (this.socket.connected != this.connected){
                console.log(this.connected ? "status: disconnected" : "status: connected");
                this.connected = this.socket.connected;
            }
        }, 1000);
    }
    // Util Functions
      
    rinseAndStringifyEntry(id, x, y, ttl){
        // Util stuff
        function checkNum(l,v){
            if (!/^\d+$/.test(v)){
                return true;
            }
            return false;
        }
        // Check socket id
        if (id === "undefined" && this.connected){
            console.log(`Warning. id is possibly undefined.  id = ${id}.`)
        }
        else if (id.length != 20){
            console.log(`Warning.  id is of unexpected length: id.length = ${id.length}`);
        }
        // Check for funny business.  These should be numbers, nothing else!
        if (checkNum("x",x)){
            console.log(`Warning. x contains non-numerical characters: ${x}`);
        }
        if (checkNum("y", y)){
            console.log(`Warning. y contains non-numerical characters: ${y}`);
        }
        if (checkNum("ttl", ttl)){
            console.log(`Warning. ttl contains non-numerical characters: ${ttl}`);
        }
        else {
            const entry = JSON.stringify({
                id: this.socket.id,
                x:x,
                y:y,
                ttl:ttl
            });
            return entry;
        }
        return false;
    }
    // Main methods
    async sendData(){ 
        document.addEventListener("mousemove", (e) => {
            let id = this.socket.id;
            let x = e.clientX;
            let y = e.clientY;
            let ttl = Date.now() + this.TIMEOUT;
            if (this.connected){
                let msg = this.rinseAndStringifyEntry(id, x, y, ttl);
                try{
                    this.socket.emit("send-data", msg)
                } catch (err) {
                    console.log(`Error sending data: ${err}`);
                }
                this.MiceManager.push(id, x, y);
            }
        });
        let activeId = null;
        document.addEventListener('touchstart', (e) => {
            let id = this.socket.id;
            const t = e.touches[0];
            activeId = t.identifier;

            let x = t.clientX;
            let y = t.clientY;
            let ttl = Date.now() + this.TIMEOUT;
            if (this.connected){
                let msg = this.rinseAndStringifyEntry(id, x, y, ttl);
                try{
                    this.socket.emit("send-data", msg);
                    this.MiceManager.push(id, x, y);
                } catch (err) {
                    console.log(`Error sending data: ${err}`);
                }
            }
        });
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();  // avoid scroll
            for (let t of e.touches) {
                if (t.identifier === activeId) {
                    let id = this.socket.id;
                    let x = t.clientX;
                    let y = t.clientY;
                    let ttl = Date.now() + this.TIMEOUT;
                    if (this.connected){
                        let msg = this.rinseAndStringifyEntry(id, x, y, ttl);
                        try{
                            this.socket.emit("send-data", msg);
                        } catch (err) {
                            console.log(`Error sending data: ${err}`);
                        }
                        this.MiceManager.push(id, x, y);
                    }
                    break;
                }
            }
        }, { passive: false }); // what is passive: false

    }
    async getData(){
        this.socket.on("get-data", (msg) => {
            const data = JSON.parse(msg);
            const { id, x, y, ttl } = data; 
            this.MiceManager.push(id, x, y);
        });
        // Listen for the dead lmao
        this.socket.on("dead", (dead) => {
            console.log(dead);
            this.MiceManager.remove(dead);
        });
    }
    async handleDisconnect(){
        this.socket.on("inactive", () =>{
            console.log("User kicked for inactivity");
            alert("Kicked for Inactivity! Reload the page.");
            this.socket.disconnect();
        })
        this.socket.on("connect_error", (err) => {
            console.log(`socket connection error: ${err}`);
            this.socket.disconnect();
        });
    }

    handle(){
        this.sendData();
        this.getData();
        this.handleDisconnect();
    }
}

const client = new Client()
client.handle();