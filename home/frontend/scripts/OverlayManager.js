class OverlayManager {
    constructor(socket){
        this.socket = socket;
        this.overlay = document.createElement("div");
        this.overlay.id = "overlay";
        this.overlay.className = "overlay";
        document.body.appendChild(this.overlay);
    }

    async display_name () {
        let container = document.getElementById("name");
        if(!container){
            container = document.createElement("div");
            container.id = "name";
            container.className = "name";
            let textbox = document.createElement("input");
            textbox.id = "textbox"
            textbox.className = "textbox";
            textbox.placeholder = "Enter a name"
            textbox.required = "true";
            let submit = document.createElement("button");
            submit.type = "submit";
            submit.id = "submit";
            submit.className = "submit";
            submit.textContent = "send";
            container.append(textbox, submit);
            this.overlay.append(container);
        }
        submit.addEventListener("click", () => {
            const tbox = document.getElementById("textbox");
            this.name = tbox.value;
            tbox.value = "";
            this.socket.emit("name", this.name);
        });
    } 
    async display_conn_status (status) {
        let container = document.getElementById("conn_status");
        if(!container){
            container = document.createElement("div");
            container.id = "conn_status";
            container.className = "conn_status";
            this.overlay.append(container);
        }
        container.innerText = status ? `Connected` : `Disconnected`;
        container.style.color = status ? "#19450e" : "#611914"
    }
    async display_conns () {
        let container = document.getElementById("num_conns");
        if (!container){
            container = document.createElement("div");
            container.id = "num_conns";
            container.className = "num_conns";
            this.overlay.append(container);
        }
        container.textContent = `Online: 0`;
        this.socket.on("num_conns", (num) => {
            let container = document.getElementById("num_conns");
            container.textContent = `Online: ${num}`;
        });
    }
    async handle() {
        this.display_name();
        this.display_conns();
    }
}