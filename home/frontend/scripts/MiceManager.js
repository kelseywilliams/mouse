class MiceManager {
    constructor () {
        this.mice = {};
    }

    push (id, x, y){
        if (!/^\d+$/.test(x) || !/^\d+$/.test(y)){
            throw Error("x and y are not numerical.")
        }
        if (id in this.mice){
            let mouse = this.mice[id];
            mouse.update(x, y);
        } else {
            this.mice[id] = new Mouse(id);
            this.mice[id].update(id, x, y);
        }
    }
    remove(id){
        let mouse = this.mice[id];
        mouse.destroy();
        delete mouse.id;
    }
}