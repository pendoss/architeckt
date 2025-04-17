import connectToRabbitMQ from '../config/config.js';

let rabbitChannel;

// Initialize the RabbitMQ channel
const initializeChannel = async () => {
    if (!rabbitChannel) {
        console.log('Initializing RabbitMQ channel for Service B...');
        const { channel } = await connectToRabbitMQ();
        rabbitChannel = channel;
        
        // Create exchange
        console.log('Creating/verifying services exchange...');
        await rabbitChannel.assertExchange('services.exchange', 'direct', { durable: true });
        
        // Ensure queues exist
        console.log('Creating/verifying service_a_queue...');
        await rabbitChannel.assertQueue('service_a_queue', { durable: true });
        console.log('Creating/verifying service_b_queue...');
        await rabbitChannel.assertQueue('service_b_queue', { durable: true });
        
        // Bind queues to exchange
        console.log('Binding service_a_queue to exchange...');
        await rabbitChannel.bindQueue('service_a_queue', 'services.exchange', 'to.service.a');
        console.log('Binding service_b_queue to exchange...');
        await rabbitChannel.bindQueue('service_b_queue', 'services.exchange', 'to.service.b');
        
        console.log('Exchange and queues set up successfully');
    }
    return rabbitChannel;
};

// Publish a message using the exchange
export const publishMessage = async (routingKey, message) => {
    try {
        console.log(`Service B attempting to publish message with routing key ${routingKey}:`, message);
        const channel = await initializeChannel();
        
        if (!channel) {
            console.error(`Failed to publish: Channel is not available`);
            throw new Error('RabbitMQ channel is not available');
        }
        
        const result = channel.publish('services.exchange', routingKey, Buffer.from(message), {
            persistent: true,
            messageId: `msg_${Date.now()}`,
            timestamp: Date.now(),
            appId: 'service-b'
        });
        
        if (result) {
            console.log(`Message successfully published to exchange with routing key ${routingKey}`);
        } else {
            console.warn(`Channel returned false when publishing, message may be buffered`);
        }
        
        return result;
    } catch (error) {
        console.error(`Error publishing message:`, error);
        throw error;
    }
};

// Consume messages from a queue
export const consumeMessage = async (queue, callback) => {
    console.log(`Setting up consumer for ${queue} in Service B...`);
    const channel = await initializeChannel();
    
    channel.consume(queue, (msg) => {
        if (msg) {
            const content = msg.content.toString();
            console.log(`Service B received message from ${queue}:`, content);
            callback(content);
            console.log(`Message content: ${msg}`,msg.content.toString())
            // No need to acknowledge the message
        }
    }, { noAck: false }); 
    
    console.log(`Now consuming messages from ${queue}`);
};

// Initialize message consumers
export const setupConsumers = async () => {
    console.log('Setting up message consumers for Service B...');
    await consumeMessage('service_b_queue', (content) => {
        try {
            const message = JSON.parse(content);
            console.log('Service B processed message:', message);
            // Process the message here
        } catch (error) {
            console.error('Error processing message in Service B:', error);
        }
    });
    console.log('Service B consumers ready');
};

// Initialize channels and consumers when this module is imported
console.log('Initializing RabbitMQ messaging for Service B...');
initializeChannel().then(() => {
    console.log('RabbitMQ channel initialized for Service B, setting up consumers...');
    return setupConsumers();
}).then(() => {
    console.log('Service B messaging setup complete');
}).catch(err => {
    console.error('Failed to initialize RabbitMQ messaging for Service B:', err);
});