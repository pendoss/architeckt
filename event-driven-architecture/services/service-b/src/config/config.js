import amqp from 'amqplib';
import { CONNECTION_STRING } from './constants.js';

const connectToRabbitMQ = async (retries = 5, delay = 5000) => {
    try {
        console.log(`Attempting to connect to RabbitMQ at ${CONNECTION_STRING}`);
        const connection = await amqp.connect(CONNECTION_STRING);
        const channel = await connection.createChannel();
        console.log('Successfully connected to RabbitMQ');
        return { connection, channel };
    } catch (error) {
        console.error(`Error connecting to RabbitMQ: ${error.message}`);
        
        if (retries > 0) {
            console.log(`Retrying in ${delay}ms... (${retries} attempts left)`);
            
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(connectToRabbitMQ(retries - 1, delay));
                }, delay);
            });
        }
        
        throw error;
    }
};

export default connectToRabbitMQ;