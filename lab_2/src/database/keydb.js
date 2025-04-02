const Redis = require('ioredis');

const host = process.env.KEYDB_HOST || 'localhost';
const port = process.env.KEYDB_PORT || 6379;
const password = process.env.KEYDB_PASSWORD;


const keydb = new Redis({
  host,
  port,
  password: password || undefined,
});

keydb.on('connect', () => {
  console.log('Connected to KeyDB successfully');
});

keydb.on('error', (err) => {
  console.error('KeyDB connection error:', err);
});

module.exports = keydb;