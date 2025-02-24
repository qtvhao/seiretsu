import { startKafkaConsumer } from './kafka/kafkaConsumer';
import { connectAmqp } from './amqp/amqpClient';
import { config } from './config';
import { Channel } from 'amqplib';

let amqpChannel: Channel | null = null;
let isShuttingDown = false;

/**
 * Initializes and caches the AMQP channel for reuse.
 */
const getAmqpChannel = async (): Promise<Channel> => {
    if (!amqpChannel) {
        try {
            amqpChannel = await connectAmqp();
            console.log('✅ AMQP Channel initialized.');
        } catch (error) {
            console.error('❌ Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }
    return amqpChannel;
};

/**
 * Handles each Kafka message by forwarding it to RabbitMQ.
 */
const eachMessageHandler = async ({ topic, partition, message }: { topic: string; partition: number; message: any }): Promise<void> => {
    try {
        const messageValue = message.value?.toString();
        if (!messageValue) {
            console.error('❌ Received empty message');
            return;
        }

        console.log(`📩 Received Kafka message: ${messageValue}`);

        // Parse the Kafka message
        const requestData = JSON.parse(messageValue);

        // Get persistent RabbitMQ channel
        const channel = await getAmqpChannel();
        const queueName = config.rabbitmq.taskQueue;

        await channel.assertQueue(queueName, { durable: true });
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(requestData)), {
            persistent: true,
        });

        console.log(`📤 Message forwarded to RabbitMQ queue: ${queueName}`);
    } catch (error) {
        console.error('❌ Error processing Kafka message:', error);
    }
};

/**
 * Gracefully shuts down the RabbitMQ connection.
 */
const shutdownRabbitMQ = async (): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log('🔻 Shutting down RabbitMQ channel...');
    try {
        if (amqpChannel) {
            await amqpChannel.close();
            amqpChannel = null;
            console.log('✅ RabbitMQ channel closed.');
        }
    } catch (error) {
        console.error('❌ Error closing RabbitMQ channel:', error);
    }
    process.exit(0);
};

// Handle process termination signals
process.on('SIGTERM', shutdownRabbitMQ);
process.on('SIGINT', shutdownRabbitMQ);

// Start the Kafka consumer with the RabbitMQ handler
startKafkaConsumer({
    topic: config.kafka.topics.request,
    groupId: config.kafka.groupId,
    eachMessageHandler,
});
