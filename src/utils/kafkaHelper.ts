// src/utils/messageQueueHelper.ts
import { getKafkaConnection } from '../kafka/kafkaClient.js';

const kafka = getKafkaConnection();
const producer = kafka.producer();

export const sendMessageToQueue = async (topic: string, message: Record<string, unknown>): Promise<void> => {
    try {
        await producer.connect();
        console.log(`Sending message to queue topic '${topic}':`, message);
        
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
        
        console.log('Message sent to queue successfully');
    } catch (error) {
        console.error('Error sending message to queue:', error);
        throw error;
    } finally {
        await producer.disconnect();
    }
};