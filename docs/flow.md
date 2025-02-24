## ✅ Recommended Flow (Kafka for Responses)

1️⃣ Kafka Producer → Sends request to REQUEST_TOPIC.

2️⃣ Kafka Consumer → Forwards request to RabbitMQ task queue (TASK_QUEUE).

3️⃣ RabbitMQ Worker → Processes request and directly sends response to Kafka (RESPONSE_TOPIC) with correlationId.

4️⃣ Kafka Consumer → Listens on RESPONSE_TOPIC and picks up the response.
