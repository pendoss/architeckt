import amqp from 'amqplib';
import { QUEUE_NAME } from '../config/constants.js';

class ServiceA {
    constructor() {
        this.channel = null;
    }

    async init() {
        const { connection, channel } = await this.connectToRabbitMQ();
        this.channel = channel;
        this.setupListeners();
    }

    async connectToRabbitMQ() {
        try {
            const connection = await amqp.connect(process.env.RABBITMQ_CONNECTION_STRING);
            const channel = await connection.createChannel();
            await channel.assertQueue(QUEUE_NAME);
            return { connection, channel };
        } catch (error) {
            console.error('Error connecting to RabbitMQ:', error);
        }
    }

    setupListeners() {
        this.channel.consume(QUEUE_NAME, (msg) => {
            if (msg !== null) {
                console.log('Received message:', msg.content.toString());
                this.channel.ack(msg);
            }
        });
    }

    async publishMessage(message) {
        this.channel.sendToQueue(QUEUE_NAME, Buffer.from(message));
        console.log('Message sent:', message);
    }
}

export default ServiceA;