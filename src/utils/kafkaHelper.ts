import { getKafkaConnection } from '../kafka/kafkaClient.js';

const kafka = getKafkaConnection();
const producer = kafka.producer();
(async () => {
    await producer.connect();
})();

export const sendMessageToQueue = async (topic: string, message: Record<string, unknown>): Promise<void> => {
    try {
        console.log(`Sending message to queue topic '${topic}':`, message);
        
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
        
        console.log('Message sent to queue successfully');
    } catch (error) {
        console.error('Error sending message to queue:', error);
        throw error;
    }
};

const shutdown = async () => {
    console.log('Disconnecting Kafka producer...');
    await producer.disconnect();
    console.log('Kafka producer disconnected');
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
