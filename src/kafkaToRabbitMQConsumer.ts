import { Kafka, Consumer } from 'kafkajs';
import { Channel } from 'amqplib';
import { getKafkaConnection } from './kafka/kafkaClient';
import { connectAmqp } from './amqp/amqpClient';
import { config } from './config';

// Get shared Kafka connection
const kafka: Kafka = getKafkaConnection();
const consumer: Consumer = kafka.consumer({ groupId: config.kafka.groupId });

let amqpChannel: Channel | null = null;

/**
 * Initializes and caches the AMQP channel for reuse.
 */
const getAmqpChannel = async (): Promise<Channel> => {
    if (!amqpChannel) {
        amqpChannel = await connectAmqp();
        console.log('✅ AMQP Channel initialized.');
    }
    return amqpChannel;
};

/**
 * Handles each Kafka message by forwarding it to RabbitMQ.
 */
const eachMessageHandler = async ({
    topic,
    partition,
    message,
}: {
    topic: string;
    partition: number;
    message: any;
}): Promise<void> => {
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
 * Starts the Kafka consumer and listens for messages.
 */
const startKafkaConsumer = async (): Promise<void> => {
    try {
        await consumer.connect();
        console.log('✅ Kafka Consumer connected');

        await consumer.subscribe({ topic: config.kafka.topics.request, fromBeginning: false });
        console.log(`🎧 Listening for messages on topic: ${config.kafka.topics.request}`);

        await consumer.run({ eachMessage: eachMessageHandler });
    } catch (error) {
        console.error('❌ Error starting Kafka consumer:', error);
    }
};

/**
 * Graceful shutdown for Kafka consumer and RabbitMQ.
 */
const shutdownKafkaConsumer = async (): Promise<void> => {
    console.log('🔻 Shutting down Kafka Consumer...');
    try {
        await consumer.disconnect();
        console.log('✅ Kafka Consumer disconnected.');
    } catch (error) {
        console.error('❌ Error disconnecting Kafka Consumer:', error);
    }

    if (amqpChannel) {
        try {
            await amqpChannel.close();
            amqpChannel = null;
            console.log('✅ RabbitMQ channel closed.');
        } catch (error) {
            console.error('❌ Error closing RabbitMQ channel:', error);
        }
    }

    console.log('🚀 Shutdown complete. Exiting process.');
    process.exit(0);
};

// Handle process termination signals (SIGINT for Ctrl+C, SIGTERM for container shutdown)
process.on('SIGTERM', shutdownKafkaConsumer);
process.on('SIGINT', shutdownKafkaConsumer);

// Start the Kafka consumer
startKafkaConsumer();
