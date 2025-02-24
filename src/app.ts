// src/app.js
import { KafkaResponseConsumer } from './kafkaResponseConsumer.js';
import { Server } from './server.js';
import { RequestResponseService } from './requestResponseService.js';
import { config } from './config.js';

class App {
    private server: Server;
    private requestResponseService: RequestResponseService;
    private kafkaResponseConsumer: KafkaResponseConsumer;

    constructor() {
        this.server = new Server();
        this.requestResponseService = new RequestResponseService();
        this.kafkaResponseConsumer = this.initializeKafkaConsumer();
    }

    /**
     * Initializes the Kafka response consumer.
     * @returns KafkaResponseConsumer instance
     */
    private initializeKafkaConsumer(): KafkaResponseConsumer {
        const kafkaConsumer = new KafkaResponseConsumer(
            config.kafka.topics.response,
            config.kafka.groupId,
            this.requestResponseService
        );

        return kafkaConsumer;
    }

    /**
     * Starts the application components.
     */
    public start(): void {
        this.server.start();
        this.kafkaResponseConsumer.start();
        console.log(`🚀 Server is running on port ${config.server.port}`);
    }
}

// Instantiate and start the application
const app = new App();
app.start();
