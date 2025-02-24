import amqp, { Connection, Channel } from 'amqplib';
import { config } from '../config';

let connection: Connection | null = null;
let channel: Channel | null = null;

/**
 * Connects to RabbitMQ and returns a channel.
 */
export const connectAmqp = async (): Promise<Channel> => {
    if (channel) {
        return channel;
    }

    try {
        connection = await amqp.connect(config.rabbitmq.url);
        channel = await connection.createChannel();
        console.log('✅ Connected to RabbitMQ');

        return channel;
    } catch (error) {
        console.error('❌ Error connecting to RabbitMQ:', error);
        throw error;
    }
};

/**
 * Closes RabbitMQ connection.
 */
export const closeAmqp = async () => {
    try {
        if (channel) {
            await channel.close();
            channel = null;
        }
        if (connection) {
            await connection.close();
            connection = null;
        }
        console.log('🔻 RabbitMQ connection closed.');
    } catch (error) {
        console.error('❌ Error closing RabbitMQ connection:', error);
    }
};
