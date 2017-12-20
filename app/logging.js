const Winston = require('winston');
const moment = require('moment');

const LOG_LEVELS = {
    "debug": 5,
    "verbose": 4,
    "info": 3,
    "warn": 2,
    "error": 1,
    "trade": 0
};

const LOG_COLORS = {
    "debug": "blue",
    "verbose": "cyan",
    "info": "green",
    "warn": "yellow",
    "error": "red",
    "trade": "magenta"
};

exports.LOG_LEVELS = LOG_LEVELS;
exports.LOG_COLORS = LOG_COLORS;
exports.register = (Automatic) => {
    let logger = Automatic.log,
        steam = Automatic.steam,
        config = Automatic.config.get();

    logger.add(Winston.transports.Console, {
        "name": "console",
        "level": (config.logs && config.logs.console && config.logs.console.level) ? config.logs.console.level : "info",
        "colorize": true,
        "timestamp": getTimestamp
    });

    // See if we want a log file, and if so, add it
    if (config.logs && config.logs.file && !config.logs.file.disabled) {
        logger.add(Winston.transports.File, {
            "name": "log.all",
            "level": config.logs.file.level || "warn",
            "filename": config.logs.file.filename || "automatic.log",
            "json": false,
            "timestamp": getTimestamp
        });
    }

    // See if we want a trade log file, and if so, add it
    if (config.logs && config.logs.trade && !config.logs.trade.disabled) {
        logger.add(Winston.transports.File, {
            "name": "log.trade",
            "level": "trade",
            "filename": config.logs.trade.filename || "automatic.trade.log",
            "json": false,
            "timestamp": getTimestamp
        });
    }

    // This function returns our timestamp format
    function getTimestamp() {
        return (steam.username ? '[' + steam.username + '] ' : '') + moment().format(config.dateFormat || "HH:mm:ss");
    }
};