class Mouse {
    constructor (id){
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.create();
    }
    create(){
        // Create mouse
        const container = document.createElement("div");
        container.id = this.id;
        container.style.position = "absolute";
        container.style.zIndex = "9999";
        container.style.pointerEvents = "none" // AI garbage.  WTF is this and what is it for
        container.style.transform = "translate(-50%, -50%)";
        const img = document.createElement("img");
        img.id = `img:${this.id}`;
        img.src = "../assets/pinkmouse.png";
        img.style.width = "15vh";
        img.style.height = "15vh";

        // Create label
        const label = document.createElement("div");
        label.id = `label:${this.id}`;
        label.textContent = this.id;

        Object.assign(label.style, {
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(211,211,211,0.7)",
            color: "black",
            padding: "2px 4px",
            fontSize: "15px",
            whiteSpace: "nowrap"
        });

        container.append(img, label);
        document.body.appendChild(container)
        
        container.style.left = `${this.x}px`;
        container.style.top = `${this.y}px`;
    }
    update (x, y, name){
        this.x = x;
        this.y = y;
        const container = document.getElementById(`${this.id}`);
        const containerLabel = document.getElementById(`label:${this.id}`);
        containerLabel.textContent = (name !== undefined) ? name : this.id;
        container.style.left = `${this.x}px`;
        container.style.top = `${this.y}px`;
    }
    destroy(){
        const container = document.getElementById(this.id);
        container.remove();
    }
}