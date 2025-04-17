import { publishMessage } from '../events/messages.js';
import connectToRabbitMQ from '../config/config.js';

const setupRoutes = (app) => {
    /**
     * @swagger
     * /api/message:
     *   post:
     *     summary: Send a message to Service B
     *     tags: [Messages]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - message
     *             properties:
     *               message:
     *                 type: string
     *     responses:
     *       200:
     *         description: Message sent successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 message:
     *                   type: string
     */
    app.post('/api/message', async (req, res) => {
        try {
            console.log('Service A received POST request to /api/message:', req.body);
            const { message } = req.body;
            if (!message) {
                console.warn('Missing message content in request');
                return res.status(400).json({ success: false, message: 'Message content is required' });
            }
            
            const payload = { 
                message, 
                sentFrom: 'service-a', 
                timestamp: new Date().toISOString() 
            };
            
            console.log('Service A attempting to send message to Service B:', payload);
            // Use the routing key instead of queue name
            await publishMessage('to.service.b', JSON.stringify(payload));
            console.log('Message successfully sent to Service B');
            
            res.json({ success: true, message: 'Message sent to Service B' });
        } catch (error) {
            console.error('Error sending message from Service A:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to send message', 
                error: error.message 
            });
        }
    });

    /**
     * @swagger
     * /api/message/exchange:
     *   post:
     *     summary: Send a message to Service B through the exchange
     *     tags: [Messages]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - message
     *             properties:
     *               message:
     *                 type: string
     *     responses:
     *       200:
     *         description: Message sent successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 message:
     *                   type: string
     */
    app.post('/api/message/exchange', async (req, res) => {
        try {
            console.log('Service A received POST request to /api/message/exchange:', req.body);
            const { message } = req.body;
            if (!message) {
                console.warn('Missing message content in request');
                return res.status(400).json({ success: false, message: 'Message content is required' });
            }
            
            const payload = { 
                message, 
                sentFrom: 'service-a', 
                sentVia: 'exchange',
                timestamp: new Date().toISOString() 
            };
            
            console.log('Service A publishing message through exchange:', payload);
            // Use the exchange and routing key
            await publishMessage('to.service.b', JSON.stringify(payload));
            
            res.json({ 
                success: true, 
                message: 'Message sent to Service B via exchange',
                details: {
                    exchange: 'services.exchange',
                    routingKey: 'to.service.b',
                    destination: 'service_b_queue'
                }
            });
        } catch (error) {
            console.error('Error sending message from Service A:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to send message', 
                error: error.message 
            });
        }
    });

    /**
     * @swagger
     * /api/message/direct:
     *   post:
     *     summary: Send a message directly to Service B queue
     *     tags: [Messages]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - message
     *             properties:
     *               message:
     *                 type: string
     *     responses:
     *       200:
     *         description: Message sent successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 message:
     *                   type: string
     */
    app.post('/api/message/direct', async (req, res) => {
        try {
            console.log('Service A received POST request to /api/message/direct:', req.body);
            const { message } = req.body;
            if (!message) {
                console.warn('Missing message content in request');
                return res.status(400).json({ success: false, message: 'Message content is required' });
            }
            
            const payload = { 
                message, 
                sentFrom: 'service-a', 
                sentVia: 'direct-queue',
                timestamp: new Date().toISOString() 
            };

            console.log('Service A sending message directly to queue:', payload);
            // Get channel to send directly to queue
            const { channel } = await connectToRabbitMQ();
            const result = channel.sendToQueue('service_b_queue', Buffer.from(JSON.stringify(payload)), {
                persistent: true,
                messageId: `direct_msg_${Date.now()}`,
                timestamp: Date.now(),
                appId: 'service-a'
            });
            
            res.json({ 
                success: result, 
                message: 'Message sent directly to Service B queue',
                details: {
                    queue: 'service_b_queue',
                    method: 'direct'
                }
            });
        } catch (error) {
            console.error('Error sending direct message from Service A:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to send direct message', 
                error: error.message 
            });
        }
    });

    /**
     * @swagger
     * /api/status:
     *   get:
     *     summary: Get the status of Service A
     *     tags: [Status]
     *     responses:
     *       200:
     *         description: Service A status
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     */
    app.get('/api/status', (req, res) => {
        console.log('Status endpoint called on Service A');
        res.json({ status: 'Service A is running' });
    });
};

export default setupRoutes;