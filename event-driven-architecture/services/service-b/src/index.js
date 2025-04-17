import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import connectToRabbitMQ from './config/config.js';
import setupRoutes from './routes/route.js';
// Import to ensure messaging setup runs
import './events/messages.js';

const startServiceB = async () => {
    const app = express();
    const PORT = process.env.PORT || 3001;

    // Swagger configuration
    const swaggerOptions = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Service B API',
                version: '1.0.0',
                description: 'Service B API documentation',
            },
            servers: [
                {
                    url: `http://localhost:${PORT}`,
                    description: 'Development server',
                },
            ],
        },
        apis: ['./src/routes/*.js'], // Path to the API docs
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Connect to RabbitMQ
    const { connection, channel } = await connectToRabbitMQ();
    console.log('RabbitMQ connection established in Service B');

    // Middleware
    app.use(express.json());

    // Setup routes
    setupRoutes(app);

    // Start the server
    app.listen(PORT, () => {
        console.log(`Service B is running on port ${PORT}`);
        console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
    });

    // Handle process termination
    process.on('SIGINT', async () => {
        console.log('Shutting down Service B...');
        await channel.close();
        await connection.close();
        process.exit(0);
    });
};

startServiceB().catch(error => {
    console.error('Failed to start Service B:', error);
});