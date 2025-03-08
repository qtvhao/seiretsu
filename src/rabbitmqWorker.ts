import { rabbitMqMessageHandler, } from './amqp/amqpConsumer.js';
import { config } from './config.js';
import { Storage } from './utils/storage.js';
import { connectAmqp } from './amqp/amqpClient.js';
import { sendMessageToQueue } from './utils/kafkaHelper.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { AudioSegmentProcessor } from "./audioSegmentProcessor.js";

const storage: Storage = new Storage();
const processor = new AudioSegmentProcessor();

/**
 * Defines the expected structure of request messages
 */
interface RequestData {
    correlationId: string;
    referenceTexts: string[];
    fileClaimCheck: string;
    language: string;
}

/**
 * Defines the structure of response messages
 */
interface ResponseData extends Record<string, unknown> {
    status: string;
    timestamp: string;
    segments?: { text: string; startTime: number; endTime: number; confidence: number }[];
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

    if (!requestData.fileClaimCheck) {
        console.warn('⚠️ Message missing fileClaimCheck, ignoring.');
        return false;
    }

    if (!requestData.referenceTexts || !Array.isArray(requestData.referenceTexts) || requestData.referenceTexts.length === 0) {
        console.warn('⚠️ Message missing or invalid referenceTexts, ignoring.');
        return false;
    }

    if (!requestData.language) {
        console.warn('⚠️ Message missing language, ignoring.');
        return false;
    }

    return true;
};

/**
 * Processes the request and sends a response to Kafka
 * @param requestData - The parsed request data
 */
const processAndRespondToKafka = async (requestData: RequestData) => {
    console.log(`📥 Processing request with correlationId: ${requestData.correlationId}`);

    const tempDir = os.tmpdir(); // Get the system's temp directory
    const tempFilePath = path.join(tempDir, requestData.fileClaimCheck);

    try {
        console.log(`⬇️ Downloading file '${requestData.fileClaimCheck}' to '${tempFilePath}'...`);

        await storage.downloadFile(requestData.fileClaimCheck, tempFilePath);

        console.log(`✅ File downloaded successfully.`);

        // Print file details
        const fileStats = fs.statSync(tempFilePath);
        console.log(`📄 File Details:
            - Name: ${requestData.fileClaimCheck}
            - Size: ${fileStats.size} bytes
            - Location: ${tempFilePath}`);

        // Process the audio file using AudioSegmentProcessor
        const segments = await processor.recursiveGetSegmentsFromAudioFile(tempFilePath, requestData.referenceTexts, requestData.language);

        // Map segments to expected format
        const mappedSegments = segments.map(segment => ({
            words: segment.words.map(word => ({
                word: word.word,
                sequence: word.sequence,
                clip: word.clip,
                start: word.start,
                end: word.end,
                confidence: word.probability,
            })),
            text: segment.rawText,
            startTime: segment.startTime,
            endTime: segment.endTime,
            confidence: segment.avgProbability
        }));

        const responseData: ResponseData = {
            ...requestData,
            status: 'Processed',
            timestamp: new Date().toISOString(),
            segments: mappedSegments,
        };

        await sendMessageToQueue(config.kafka.topics.response, responseData);

        console.log(`📤 Sent response to Kafka with correlationId: ${responseData.correlationId}`);
    } catch (error) {
        console.error(`❌ Error processing file '${requestData.fileClaimCheck}':`, error);
    }
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
