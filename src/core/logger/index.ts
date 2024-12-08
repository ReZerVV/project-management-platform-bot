import * as winston from "winston";
import * as path from "path";

const LOGS_PATH = process.env.LOGS_PATH || path.join(__dirname, "logs");

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(
            ({ level, message, timestamp }) =>
                `[${timestamp}] ${level.toUpperCase()}: ${message}`
        )
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(LOGS_PATH, "application.log"),
            level: "info",
        }),
        new winston.transports.File({
            filename: path.join(LOGS_PATH, "error.log"),
            level: "error",
        }),
    ],
});

logger.add(
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
                ({ level, message, timestamp }) =>
                    `[${timestamp}] ${level}: ${message}`
            )
        ),
    })
);

export function info(...values: any[]) {
    const message = values.join(" ");
    logger.info(message);
}

export function warn(...values: any[]) {
    const message = values.join(" ");
    logger.warn(message);
}

export function error(...values: any[]) {
    const message = values.join(" ");
    logger.error(message);
}
