class MiceManager {
    constructor () {
        this.mice = {};
    }

    push (id, x, y, name, avatar){
        if (!/^\d+$/.test(x) || !/^\d+$/.test(y)){
            throw Error("x and y are not numerical.")
        }
        if (id in this.mice){
            let mouse = this.mice[id];
            mouse.update(x, y, name);
        } else {
            this.mice[id] = new Mouse(id);
            this.mice[id].update(x, y, name);
        }
    }
    set_avatar(id, avatar){
        if (id in this.mice) {
            let mouse = this.mice[id];
            mouse.set_avatar(avatar);
        } else {
            this.mice[id] = new Mouse(id);
            this.mice[id].update(x, y);
            this.mice[id].set_avatar(avatar);
        }
    }
    set_name(id, name){
        if (id in this.mice){
            let mouse = this.mice[id];
            mouse.set_name(name);
        } else {
            this.mice[id] = new Mouse(id);
            this.mice[id].update(x, y, name);
            this.mice[id].set_name(name);
        }
    }
    remove(id){
        if (id in this.mice){
            let mouse = this.mice[id];
            mouse.destroy();
            delete mouse.id;
        }
    }
}