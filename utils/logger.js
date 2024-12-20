const winston = require("winston");

// Create a Winston logger instance
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        // You can add more transports here, such as file, database, etc.
    ],
});

module.exports = logger;