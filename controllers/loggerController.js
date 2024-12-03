const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, simple } = format;


const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = createLogger({
  level: 'info',
  format: combine(
    colorize(),
    timestamp(),
    simple()
  ),
  transports: [
    new transports.Console(),
    // new transports.File({ filename: path.join(logDir, 'info.log'), level: 'info' }) /
  ],
});

module.exports = logger;


