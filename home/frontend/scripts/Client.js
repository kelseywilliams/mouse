class Client {
    constructor(){
        this.socket = io();
        this.TIMEOUT = 15000;
    }
    // Util Functions
    createMouse(id, mice) {
        // Create a container to hold both the pointer and the label.
        const container = document.createElement("div");
        container.style.position = "absolute";

        // Create the fake mouse pointer as an arrow shape.
        const fakeMouse = document.createElement("div");
        fakeMouse.style.width = "8px";
        fakeMouse.style.height = "16px";
        fakeMouse.style.backgroundColor = "black";
        fakeMouse.style.clipPath = "polygon(10% 0, 0 80%, 100% 65%)";
        fakeMouse.style.pointerEvents = "none"; // so it doesn't block clicks
    

        // Create the label displaying the id.
        const label = document.createElement("div");
        label.textContent = id;
        label.style.position = "absolute";
        label.style.bottom = "100%"; // position above the pointer
        label.style.left = "50%";
        label.style.transform = "translateX(-50%)";
        label.style.backgroundColor = "rgba(211,211,211,0.7)"; // light grey, mostly transparent
        label.style.color = "black";
        label.style.padding = "2px 4px";
        label.style.fontSize = "10px";
        label.style.whiteSpace = "nowrap";

        // Append label and pointer to the container.
        container.appendChild(label);
        container.appendChild(fakeMouse);

        // Append the container to the document.
        document.body.appendChild(container);

        mice[id] = container;
    }
    rinseAndStringifyEntry(id, x, y, ttl){
        // Util stuff
        function checkNum(l,v){
            if (!v){
                console.log(`Warning. ${l} is possibly undefined.  ${l} = ${v}`)
            }
            if (!/^\d+$/.test(v)){
                return true;
            }
            return false;
        }
        // Check socket id
        if (!id){
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
            let msg = this.rinseAndStringifyEntry(this.socket.id, x, y, ttl);
            if (!msg){
                console.log("Dropped entry. Aborting and continuing...")
            }
            try{
                if (this.socket.id){
                    this.socket.emit("send-coords", msg)
                }
            } catch (err) {
                console.log(`Error sending data: ${err}`);
            }

        });
    }
    async getCoords(){
        const mice = {};
        this.socket.on("get-coords", (msg) => {
            const data = JSON.parse(msg);
            const { id, x, y, ttl } = data; 
            if (id && !mice[id]) {
                console.log(mice);
                this.createMouse(id, mice);
            } else {
                // Update that user's mouse position
                mice[id].style.left = x + "px";
                mice[id].style.top = y + "px";
            }
        });
    }
    async handleDisconnect(){
        this.socket.on("inactivity", () =>{
            console.log("User inactive for too long");
            this.socket.disconnect();
        })
        this.socket.on("disconnect", (err) => {
            console.log(`socket disconnected: ${err}`);
            this.socket.disconnect();
        });
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