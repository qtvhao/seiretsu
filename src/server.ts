// src/server.js
import express, { Application, Request, Response } from 'express';

export class Server {
    private app: Application;
    private port: number;

    constructor(port: number = 3000) {
        this.app = express();
        this.port = port;
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.app.get('/healthz', (req: Request, res: Response) => {
            res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
        });
    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`Server is running on http://localhost:${this.port}`);
        });
    }

    public stop(): void {
        console.log('Server shutting down...');
        process.exit(0);
    }
}
