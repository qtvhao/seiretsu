import { EachMessagePayload } from 'kafkajs';
import { Channel } from 'amqplib';
import { connectAmqp } from './amqp/amqpClient.js';
import { config } from './config.js';
import { startKafkaConsumer } from './kafka/kafkaConsumer.js';

export class KafkaToRabbitMQConsumer {
    private rabbitMQChannel: Channel | null = null;
    private isShuttingDown: boolean = false;

    /**
     * Initializes Kafka and RabbitMQ consumers
     */
    public async start(): Promise<void> {
        try {
            this.rabbitMQChannel = await connectAmqp();
            this.setupTerminationHandlers();
            await startKafkaConsumer({
                topic: config.kafka.topics.request,
                groupId: config.kafka.groupId,
                eachMessageHandler: async (payload) => await this.processMessage(payload),
            });
        } catch (error) {
            console.error('❌ Error starting Kafka consumer:', error);
            process.exit(1);
        }
    }

    /**
     * Processes each Kafka message and forwards it to RabbitMQ
     * @param payload Kafka message payload
     */
    private async processMessage({ topic, partition, message }: EachMessagePayload): Promise<void> {
        try {
            const messageValue = message.value?.toString();
            if (!messageValue) {
                console.error('❌ Received empty Kafka message');
                return;
            }

            console.log(`📩 Received Kafka message: ${messageValue}`);

            let requestData;
            try {
                requestData = JSON.parse(messageValue);
            } catch (error) {
                console.error('❌ Invalid JSON received:', messageValue);
                return;
            }

            await this.forwardToRabbitMQ(requestData);
        } catch (error) {
            console.error('❌ Error processing Kafka message:', error);
        }
    }

    /**
     * Forwards message to RabbitMQ queue
     * @param data Data to be sent
     */
    private async forwardToRabbitMQ(data: any): Promise<void> {
        try {
            if (!this.rabbitMQChannel) {
                console.error('❌ RabbitMQ channel not initialized. Dropping message.');
                return;
            }

            const queueName = config.rabbitmq.taskQueue;
            await this.rabbitMQChannel.assertQueue(queueName, { durable: true });

            this.rabbitMQChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), { persistent: true });

            console.log(`📤 Message forwarded to RabbitMQ queue: ${queueName}`);
        } catch (error) {
            console.error('❌ Failed to send message to RabbitMQ:', error);
        }
    }

    /**
     * Gracefully shuts down RabbitMQ consumers
     */
    public async shutdown(): Promise<void> {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;

        console.log('🔻 Shutting down KafkaToRabbitMQConsumer...');

        try {
            if (this.rabbitMQChannel) {
                await this.rabbitMQChannel.close();
                this.rabbitMQChannel = null;
                console.log('✅ RabbitMQ connection closed.');
            }
        } catch (error) {
            console.error('❌ Error closing RabbitMQ connection:', error);
        }

        setTimeout(() => process.exit(0), 500);
    }

    /**
     * Sets up termination handlers for graceful shutdown
     */
    private setupTerminationHandlers(): void {
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }
}
