class OverlayManager {
    constructor(socket){
        this.socket = socket;
        this.overlay = document.createElement("div");
        this.overlay.id = "overlay";
        this.overlay.className = "overlay";
        document.body.appendChild(this.overlay);
    }

    // async name () {
    //     // TODO create form in bottom left corner
    //     // Figure out handler or endpoint for name form
    // } 
    async conn_status (status) {
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
    async displayConns () {
        this.socket.on("num_conns", (num) => {
            let container = document.getElementById("num_conns");
            if (!container){
                container = document.createElement("div");
                container.id = "num_conns";
                container.className = "num_conns";
                this.overlay.append(container);
            }
            container.textContent = `Online: ${num}`;
        });
    }
}