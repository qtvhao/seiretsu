import { rabbitMqMessageHandler, } from './amqp/amqpConsumer.js';
import { config } from './config.js';
import { connectAmqp } from './amqp/amqpClient.js';
import { sendMessageToQueue } from './utils/kafkaHelper.js';

/**
 * Defines the expected structure of request messages
 */
interface RequestData {
    correlationId: string;
    payload: any;
}

/**
 * Defines the structure of response messages
 */
interface ResponseData extends Record<string, unknown> {
    correlationId: string;
    payload: any;
    status: string;
    timestamp: string;
}

/**
 * Validates the parsed message
 * @param requestData - Parsed message
 * @returns Boolean indicating whether the message is valid
 */
const validateMessage = (requestData: RequestData | null): boolean => {
    if (!requestData) return false;

    if (!requestData.correlationId) {
        console.warn('⚠️ Message missing correlationId, ignoring.');
        return false;
    }

    return true;
};

/**
 * Processes the request and sends a response to Kafka
 * @param requestData - The parsed request data
 */
const processAndRespondToKafka = async (requestData: RequestData) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const responseData: ResponseData = {
        ...requestData,
        status: 'Processed',
        timestamp: new Date().toISOString(),
    };

    await sendMessageToQueue(config.kafka.topics.response, responseData);

    console.log(`📤 Sent response to Kafka with correlationId: ${responseData.correlationId}`, responseData);
};

/**
 * Initializes the RabbitMQ consumer and Kafka producer
 */
const startWorker = async (): Promise<void> => {
    let amqpChannel = await connectAmqp();
    try {
        console.log('🚀 Starting RabbitMQ Worker...');

        // Start consuming messages from RabbitMQ using the generic handler
        amqpChannel.consume(config.rabbitmq.taskQueue, rabbitMqMessageHandler(amqpChannel, validateMessage, processAndRespondToKafka));

        console.log(`✅ RabbitMQ Consumer listening on queue: ${config.rabbitmq.taskQueue}`);
    } catch (error) {
        console.error('❌ Failed to start worker:', error);
    }
};

// Start the worker
startWorker();
