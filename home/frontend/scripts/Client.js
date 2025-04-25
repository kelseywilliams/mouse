class Client {
    constructor(){
        this.socket = io();
        this.TIMEOUT = 30000;
        this.connected = false;
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
    createMouse(id, mice) {
        // container for image + label
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.pointerEvents = "none"; // let clicks pass through
      
        // the custom cursor image
        const img = document.createElement("img");
        img.src = "/assets/mouse-standing.png";
        img.style.width = "100%";    // adjust to your sprite size
        img.style.height = "100%";
      
        // label showing the id
        const label = document.createElement("div");
        label.textContent = id;
        Object.assign(label.style, {
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(211,211,211,0.7)",
          color: "black",
          padding: "2px 4px",
          fontSize: "10px",
          whiteSpace: "nowrap"
        });
      
        container.append(img, label);
        document.body.appendChild(container);
        mice[id] = container;
    }
      
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
    async sendCoords(){ 
        document.addEventListener("mousemove", (e) => {
            let x = e.clientX;
            let y = e.clientY;
            let ttl = Date.now() + this.TIMEOUT;
            if (this.connected){
                let msg = this.rinseAndStringifyEntry(this.socket.id, x, y, ttl);
                try{
                    this.socket.emit("send-coords", msg)
                } catch (err) {
                    console.log(`Error sending data: ${err}`);
                }
            }
        });
        // where your cursor art lives
        const CURSOR_SRC = '/assets/mouse-standing.png';

        let cursorEl = null;
        let activeId = null;

        document.addEventListener('touchstart', e => {
            const t = e.touches[0];
            activeId = t.identifier;

            let x = e.clientX;
            let y = e.clientY;
            let ttl = Date.now() + this.TIMEOUT;
            if (this.connected){
                let msg = this.rinseAndStringifyEntry(this.socket.id, x, y, ttl);
                try{
                    this.socket.emit("send-coords", msg)
                } catch (err) {
                    console.log(`Error sending data: ${err}`);
                }
            }
            // only create it once
            if (!cursorEl) {
                cursorEl = document.createElement('img');
                cursorEl.src = CURSOR_SRC;
                Object.assign(cursorEl.style, {
                position: 'absolute',
                width: '24px',
                height: '24px',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
                });
                document.body.appendChild(cursorEl);
            }

            // move it immediately
            cursorEl.style.left = `${t.clientX}px`;
            cursorEl.style.top  = `${t.clientY}px`;
        }, { passive: false });

        document.addEventListener('touchmove', e => {
            e.preventDefault();  // avoid scroll
            for (let t of e.touches) {
                if (t.identifier === activeId) {
                cursorEl.style.left = `${t.clientX}px`;
                cursorEl.style.top  = `${t.clientY}px`;
                let x = t.clientX;
                let y = t.clientY;
                let ttl = Date.now() + this.TIMEOUT;
                if (this.connected){
                    let msg = this.rinseAndStringifyEntry(this.socket.id, x, y, ttl);
                    try{
                        this.socket.emit("send-coords", msg)
                    } catch (err) {
                        console.log(`Error sending data: ${err}`);
                    }
                }
                break;
                }
            }
        }, { passive: false });

    }
    async getCoords(){
        const mice = {};
        this.socket.on("get-coords", (msg) => {
            const data = JSON.parse(msg);
            const { id, x, y, ttl } = data; 
            if (id && !mice[id]) {
                this.createMouse(id, mice);
            } else {
                // Update that user's mouse position
                mice[id].style.left = x + "px";
                mice[id].style.top = y + "px";
            }
        });
    }
    async handleDisconnect(){
        this.socket.on("inactive", () =>{
            console.log("User kicked for inactivity");
            this.socket.disconnect();
        })
        this.socket.on("connect_error", (err) => {
            console.log(`socket connection error: ${err}`);
            this.socket.disconnect();
        });
    }

    handle(){
        this.sendCoords(this.socket);
        this.getCoords(this.socket);
        this.handleDisconnect(this.socket);
    }
}

const client = new Client()
client.handle();