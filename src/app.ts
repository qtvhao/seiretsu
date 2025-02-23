// src/app.js
import { Server } from './server.js';

class App {
    public server: Server;
    constructor() {
        this.server = new Server();
    }

    start() {
        this.server.start();
    }
}

const app = new App();
app.start();
