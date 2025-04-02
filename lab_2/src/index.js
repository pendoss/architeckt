const express = require('express');
const router = require('./routes/route.js');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger.js');

const app = express();
const port = process.env.PORT || 6279;

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api/tasks', router);

app.listen(port, () => {
    console.log("API is workie workie on port " + port);
});