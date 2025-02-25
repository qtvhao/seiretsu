import { startKafkaConsumer } from './kafka/kafkaConsumer.js';
import { RequestResponseService } from './requestResponseService.js';
import { EachMessagePayload } from 'kafkajs';

export class KafkaResponseConsumer {
    private requestResponseService: any;

    private topic: string;
    private groupId: string;

    constructor(topic: string, groupId: string, requestResponseService: RequestResponseService) {
        this.requestResponseService = requestResponseService;
        this.topic = topic;
        this.groupId = groupId;
    }

    /**
     * Handles incoming Kafka messages on the response topic.
     */
    async eachMessageHandler({ topic, partition, message }: EachMessagePayload): Promise<void> {
        try {
            const messageValue = message.value?.toString();
            if (!messageValue) {
                console.error('❌ Received empty message');
                return;
            }

            console.log(`📩 Received Kafka response message: ${messageValue}`);
            
            // Process the response message (can be customized further)
            const responseData = JSON.parse(messageValue);
            this.processResponse(responseData);
            if (responseData.correlationId) {
                this.requestResponseService.handleResponse(responseData.correlationId, responseData);
            }
        } catch (error) {
            console.error('❌ Error processing Kafka response message:', error);
        }
    }

    /**
     * Processes the received response message.
     * Emits an event with the response data.
     */
    processResponse(responseData: Record<string, unknown>): void {
        console.log('✅ Processing response:', responseData);
    }

    /**
     * Starts the Kafka consumer for listening to the response topic.
     */
    async start(): Promise<void> {
        console.log(`🚀 Starting Kafka Consumer for topic: ${this.topic}`);
        await startKafkaConsumer({
            topic: this.topic,
            groupId: this.groupId,
            eachMessageHandler: this.eachMessageHandler.bind(this),
        });
    }
}
