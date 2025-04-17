import connectToRabbitMQ from '../config/config.js';

let rabbitChannel;

// Initialize the RabbitMQ channel
const initializeChannel = async () => {
    if (!rabbitChannel) {
        console.log('Initializing RabbitMQ channel for Service A...');
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

// Add this function after initializeChannel
const verifyExchangeAndQueueBindings = async () => {
    try {
        console.log('🔍 Verifying exchange and queue bindings...');
        const channel = await initializeChannel();
        
        // List exchanges - note this requires management plugin permissions
        // This may not work with default permissions
        try {
            console.log('Checking if exchange exists...');
            await channel.checkExchange('services.exchange');
            console.log('Exchange services.exchange exists');
        } catch (error) {
            console.error('Exchange check failed:', error.message);
        }
        
        // Verify queues
        try {
            console.log('Checking if service_a_queue exists...');
            const queueA = await channel.checkQueue('service_a_queue');
            console.log('Queue service_a_queue exists:', queueA);
        } catch (error) {
            console.error('Queue check failed for service_a_queue:', error.message);
        }
        
        try {
            console.log('Checking if service_b_queue exists...');
            const queueB = await channel.checkQueue('service_b_queue');
            console.log('Queue service_b_queue exists:', queueB);
        } catch (error) {
            console.error('Queue check failed for service_b_queue:', error.message);
        }
        
        // Since we can't directly check bindings through the API, we can test them
        console.log('Note: Cannot directly check bindings through API, but they should have been created during initialization');
        
        console.log('Exchange and queue verification complete');
    } catch (error) {
        console.error('Error verifying RabbitMQ setup:', error);
    }
};

// Publish a message using the exchange
export const publishMessage = async (routingKey, message) => {
    try {
        console.log(`Service A attempting to publish message with routing key ${routingKey}:`, message);
        const channel = await initializeChannel();
        
        if (!channel) {
            console.error(`Failed to publish: Channel is not available`);
            throw new Error('RabbitMQ channel is not available');
        }
        
        const result = channel.publish('services.exchange', routingKey, Buffer.from(message), {
            persistent: true,
            messageId: `msg_${Date.now()}`,
            timestamp: Date.now(),
            appId: 'service-a'
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
    console.log(`Setting up consumer for ${queue} in Service A...`);
    const channel = await initializeChannel();
    
    channel.consume(queue, (msg) => {
        if (msg) {
            const content = msg.content.toString();
            console.log(`Service A received message from ${queue}:`, content);
            callback(content);
            // No need to acknowledge the message
        }
    }, { noAck: false }); // Set to true for automatic acknowledgment
    
    console.log(`Now consuming messages from ${queue}`);
};

// Initialize message consumers
export const setupConsumers = async () => {
    console.log('Setting up message consumers for Service A...');
    await consumeMessage('service_a_queue', (content) => {
        try {
            const message = JSON.parse(content);
            console.log('Service A processed message:', message);
            // Process the message here
        } catch (error) {
            console.error('Error processing message in Service A:', error);
        }
    });
    console.log('Service A consumers ready');
};

// Initialize channels and consumers when this module is imported
console.log('Initializing RabbitMQ messaging for Service A...');
initializeChannel().then(() => {
    console.log('RabbitMQ channel initialized for Service A, verifying setup...');
    return verifyExchangeAndQueueBindings();
}).then(() => {
    console.log('Setting up consumers...');
    return setupConsumers();
}).then(() => {
    console.log('Service A messaging setup complete');
}).catch(err => {
    console.error('Failed to initialize RabbitMQ messaging for Service A:', err);
});