import { Channel, ConsumeMessage } from 'amqplib';

export const acknowledgeMessage = (amqpChannel: Channel, message: ConsumeMessage, success: boolean) => {
    if (!amqpChannel) return;

    if (success) {
        amqpChannel.ack(message);
    } else {
        amqpChannel.nack(message, false, false); // Send to DLQ if configured
    }
};

/**
 * Parses a RabbitMQ message into JSON format
 * @param message - RabbitMQ message
 * @returns Parsed RequestData or null if invalid
 */
const parseMessage = (message: ConsumeMessage | null) => {
    if (!message) {
        console.warn('⚠️ Received a null RabbitMQ message');
        return null;
    }

    try {
        return JSON.parse(message.content.toString());
    } catch (error) {
        console.error('❌ Failed to parse message as JSON, sending to DLQ', error);
        return null;
    }
};
/**
 * Generic RabbitMQ message handler
 */
export const rabbitMqMessageHandler = (
    amqpChannel: Channel,
    validateMessage: Function,
    processFunction: Function,
) => {
    return async (message: ConsumeMessage | null,) => {
        const requestData = parseMessage(message);

        if (!validateMessage(requestData)) {
            if (message) acknowledgeMessage(amqpChannel, message, false);
            return;
        }

        console.log(`📥 Received message from RabbitMQ: ${JSON.stringify(requestData)}`);

        try {
            await processFunction(requestData);
            if (message) acknowledgeMessage(amqpChannel, message, true);
        } catch (error) {
            console.error('❌ Error processing RabbitMQ message:', error);
            if (message) acknowledgeMessage(amqpChannel, message, false);
        }
    }
};
