const socket = io();

async function sendCoords(socket){
    document.addEventListener("mousemove", function(e) {
        document.getElementById("x").textContent = `X=${e.clientX}`;
        document.getElementById("y").textContent = `Y=${e.clientY}`;
        const msg = JSON.stringify({"id":socket.id,"x":e.clientX,"y":e.clientY,"ttl":Date.now()});
        try{
            if (socket.id){
                socket.emit("send-coords", msg)
            }
        } catch (err) {
            console.log(`Error sending data: ${err}`);
        }

    });
}
async function getCoords(socket){
    const mice = {};
    socket.on("get-coords", (msg) => {
        const data = JSON.parse(msg);
        const { id, x, y, ttl } = data; 
        if (id && !mice[id]) {
            console.log(mice);
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
        } else {
            // Update that user's mouse position
            mice[id].style.left = x + "px";
            mice[id].style.top = y + "px";
        }
    });
}
async function handleDisconnect(socket){
    socket.on("inactivity", () =>{
        console.log("User inactive for too long");
        socket.disconnect();
    })
    socket.on("disconnect", (err) => {
        console.log(`Socket disconnected: ${err}`);
        socket.disconnect();
    });
    socket.on("connect_error", (err) => {
        console.log(`Socket connection error: ${err}`);
        socket.disconnect();
    });
}
sendCoords(socket);
getCoords(socket);
handleDisconnect(socket);