class Mouse {
    constructor (id){
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.create();
        this.current_avatar;
        this.avatars = ["assets/pinkmouse.png", "assets/mouse.png"]
    }
    create(){
        // Create mouse
        const container = document.createElement("div");
        container.id = this.id;
        container.style.position = "fixed";
        container.style.zIndex = "9999";
        container.style.pointerEvents = "none" // AI garbage.  WTF is this and what is it for
        container.style.transform = "translate(-50%, -50%)";
        const img = document.createElement("img");
        img.id = `img:${this.id}`;
        // Make this selection random
        this.current_avatar = 0;
        img.src = this.avatars[0];
        img.style.width = "70px";
        img.style.height = "70px";

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
    set_avatar(avatar){
        const containerImage = document.getElementById(`img:${this.id}`)
        if(avatar !== undefined) {
            containerImage.src = this.avatar[avatars];
            this.current_avatar = avatar;
        } else {
            containerImage.src = this.current_avatar;
        }
    }
    set_name(name){
        const containerLabel = document.getElementById(`label:${this.id}`);
        containerLabel.textContent = (name !== undefined) ? name : this.id;
    }
    destroy(){
        const container = document.getElementById(this.id);
        container.remove();
    }
}