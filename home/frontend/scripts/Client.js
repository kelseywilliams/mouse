class Client {
    constructor(){
        this.socket = io();
        this.TIMEOUT = 300000;
        this.connected = false;
        this.name = undefined;
        this.mice_manager = new MiceManager();
        this.overlay_manager = new OverlayManager(this.socket);
        this.clock();
    }
    clock() {
        setInterval(() => {
            // Connection check
            if (this.socket.connected != this.connected){
                console.log(this.connected ? "status: disconnected" : "status: connected");
                this.connected = this.socket.connected;
                document.body.style.cursor = this.connected ? 'auto' : 'none';
                this.overlay_manager.display_conn_status(this.connected);
            }
        }, 1000);
    }
    // Util Functions
    
    // None of the these conditions should be possible without malicious intervention 
    // clientside.  Therefore, this will be removed in later version as proper 
    // sanitization is handled on the backend.
    debug(id, x, y, ttl, name){
        // Util stuff
        function checkNum(l,v){
            if (!/^\d+$/.test(v)){
                return true;
            }
            return false;
        }
        // Check socket id
        if (id === undefined && this.connected){
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
                id: id,
                x:x,
                y:y,
                ttl:ttl,
                name:name
            });
            return entry;
        }
        return false;
    }
    // Main methods
    async send_data(){ 
        document.addEventListener("mousemove", (e) => {
            let id = this.socket.id;
            let x = e.clientX;
            let y = e.clientY;
            let ttl = Date.now() + this.TIMEOUT;
            let name = this.name;
            if (this.connected){
                let msg = this.debug(id, x, y, ttl, name);
                try{
                    this.socket.emit("send-data", msg)
                } catch (err) {
                    console.log(`Error sending data: ${err}`);
                }
                this.mice_manager.push(id, x, y, name);
            }
        });
        let activeId = null;
        document.addEventListener('touchstart', (e) => {
            let id = this.socket.id;
            const t = e.touches[0];
            activeId = t.identifier;

            let x = Math.round(t.clientX);
            let y = Math.round(t.clientY);
            let ttl = Date.now() + this.TIMEOUT;
            let name = this.name;
            if (this.connected){
                let msg = this.debug(id, x, y, ttl, name);
                try{
                    this.socket.emit("send-data", msg);
                    this.mice_manager.push(id, x, y, name);
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
                    let x = Math.round(t.clientX);
                    let y = Math.round(t.clientY);
                    let ttl = Date.now() + this.TIMEOUT;
                    let name = this.name;
                    if (this.connected){
                        let msg = this.debug(id, x, y, ttl, name);
                        try{
                            this.socket.emit("send-data", msg);
                        } catch (err) {
                            console.log(`Error sending data: ${err}`);
                        }
                        this.mice_manager.push(id, x, y, name);
                    }
                    break;
                }
            }
        }, { passive: false }); // what is passive: false

    }
    async get_data(){
        this.socket.on("get-data", (msg) => {
            const data = JSON.parse(msg);
            const { id, x, y, ttl, name } = data; 
            this.mice_manager.push(id, x, y, name);
        });
        // Listen for the dead lmao
        this.socket.on("dead", (dead) => {
            console.log(`${dead} left`);
            this.mice_manager.remove(dead);
        });
        this.socket.on("set-name", (name) => {
            this.name = name;
            this.mice_manager.set_name(this.socket.id, name);
        });
    }
    async handle_disconnect(){
        this.socket.on("inactive", () =>{
            console.log("Kicked for inactivity");
            alert("Kicked for Inactivity! Reload the page.");
            this.socket.disconnect();
        })
        this.socket.on("connect_error", (err) => {
            console.log(`Socket connection error: ${err}`);
            this.socket.disconnect();
        });
    }

    handle(){
        this.send_data();
        this.get_data();
        this.handle_disconnect();
        this.overlay_manager.handle();
        this.overlay_manager.display_conn_status(this.connected)
    }
}

const client = new Client()
client.handle();