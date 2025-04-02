const express = require('express');

const app = express();
const port = process.env.PORT || 6279;

app.get('/', (req, res) => {
    res.send("<h1>HELLLLLOOOOOOOOOOO</h1>");
});

app.listen(port, () => {
    console.log("API is workie workie on port " + port);
});

