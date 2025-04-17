import { publishMessage } from '../events/messages.js';
import connectToRabbitMQ from '../config/config.js';

const setupRoutes = (app) => {
    /**
     * @swagger
     * /api/message:
     *   post:
     *     summary: Send a message to Service A
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
            console.log('Service B received POST request to /api/message:', req.body);
            const { message } = req.body;
            if (!message) {
                console.warn('Missing message content in request');
                return res.status(400).json({ success: false, message: 'Message content is required' });
            }
            
            const payload = { 
                message, 
                sentFrom: 'service-b', 
                timestamp: new Date().toISOString() 
            };
            
            console.log('Service B attempting to send message to Service A:', payload);
            // Use the routing key instead of queue name
            await publishMessage('to.service.a', JSON.stringify(payload));
            console.log('Message successfully sent to Service A');
            
            res.json({ success: true, message: 'Message sent to Service A' });
        } catch (error) {
            console.error('Error sending message from Service B:', error);
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
     *     summary: Send a message to Service A through the exchange
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
            console.log('Service B received POST request to /api/message/exchange:', req.body);
            const { message } = req.body;
            if (!message) {
                console.warn('Missing message content in request');
                return res.status(400).json({ success: false, message: 'Message content is required' });
            }
            
            const payload = { 
                message, 
                sentFrom: 'service-b', 
                sentVia: 'exchange',
                timestamp: new Date().toISOString() 
            };
            
            console.log('Service B publishing message through exchange:', payload);
            // Use the exchange and routing key
            await publishMessage('to.service.a', JSON.stringify(payload));
            
            res.json({ 
                success: true, 
                message: 'Message sent to Service A via exchange',
                details: {
                    exchange: 'services.exchange',
                    routingKey: 'to.service.a',
                    destination: 'service_a_queue'
                }
            });
        } catch (error) {
            console.error('Error sending message from Service B:', error);
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
     *     summary: Send a message directly to Service A queue
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
            console.log('Service B received POST request to /api/message/direct:', req.body);
            const { message } = req.body;
            if (!message) {
                console.warn('Missing message content in request');
                return res.status(400).json({ success: false, message: 'Message content is required' });
            }
            
            const payload = { 
                message, 
                sentFrom: 'service-b', 
                sentVia: 'direct-queue',
                timestamp: new Date().toISOString() 
            };

            console.log('Service B sending message directly to queue:', payload);
            // Get channel to send directly to queue
            const { channel } = await connectToRabbitMQ();
            const result = channel.sendToQueue('service_a_queue', Buffer.from(JSON.stringify(payload)), {
                persistent: true,
                messageId: `direct_msg_${Date.now()}`,
                timestamp: Date.now(),
                appId: 'service-b'
            });
            
            res.json({ 
                success: result, 
                message: 'Message sent directly to Service A queue',
                details: {
                    queue: 'service_a_queue',
                    method: 'direct'
                }
            });
        } catch (error) {
            console.error('Error sending direct message from Service B:', error);
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
     *     summary: Get the status of Service B
     *     tags: [Status]
     *     responses:
     *       200:
     *         description: Service B status
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     */
    app.get('/api/status', (req, res) => {
        console.log('Status endpoint called on Service B');
        res.json({ status: 'Service B is running' });
    });
};

export default setupRoutes;