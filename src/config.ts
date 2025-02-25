// src/config.js
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from a .env file

// Define TypeScript interfaces for configuration
interface KafkaTopics {
    request: string;
    response: string;
}

interface KafkaConfig {
    clientId: string;
    brokers: string[];
    groupId: string;
    topics: KafkaTopics;
}

interface RabbitMQConfig {
    url: string;
    taskQueue: string;
    prefetch: number;
}

interface ServerConfig {
    port: number;
}

interface MinioConfig {
    endpoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
    useSSL: boolean;
    bucketName: string;
}

interface AppConfig {
    kafka: KafkaConfig;
    rabbitmq: RabbitMQConfig;
    server: ServerConfig;
    minio: MinioConfig;
}

// Helper function to get environment variables
const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value || defaultValue!;
};

// Helper function to get numeric environment variables
const getEnvNumber = (key: string, defaultValue?: number): number => {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value ? Number(value) : defaultValue!;
};

// Construct the strongly typed config object
export const config: AppConfig = {
    kafka: {
        clientId: getEnv('KAFKA_CLIENT_ID', 'my-app'),
        brokers: getEnv('KAFKA_BROKERS', 'localhost:9092').split(','),
        groupId: getEnv('KAFKA_GROUP_ID', 'my-consumer-group'),
        topics: {
            request: getEnv('KAFKA_REQUEST_TOPIC', 'REQUEST_TOPIC'),
            response: getEnv('KAFKA_RESPONSE_TOPIC', 'RESPONSE_TOPIC'),
        },
    },
    rabbitmq: {
        url: getEnv('RABBITMQ_URL', 'amqp://localhost'),
        taskQueue: getEnv('RABBITMQ_TASK_QUEUE', 'TASK_QUEUE'),
        prefetch: getEnvNumber('RABBITMQ_PREFETCH', 1), // Limit concurrent processing
    },
    server: {
        port: getEnvNumber('SERVER_PORT', 3000),
    },
    minio: {
        endpoint: getEnv('MINIO_ENDPOINT', 'localhost'),
        port: getEnvNumber('MINIO_PORT', 9000),
        accessKey: getEnv('MINIO_ROOT_USER', 'minioadmin'),
        secretKey: getEnv('MINIO_ROOT_PASSWORD', 'minioadmin'),
        useSSL: getEnv('MINIO_USE_SSL', 'false') === 'true',
        bucketName: getEnv('MINIO_BUCKET_NAME', 'my-bucket'),
    },
};
