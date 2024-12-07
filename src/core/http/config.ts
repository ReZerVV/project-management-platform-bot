import * as logger from "@/core/logger";

export const DEFAULT_APP_PORT = 3000;

if (process.env.APP_PORT !== undefined) {
    logger.info(
        `APP_PORT is defined. the default value for the APP_PORT variable will be used: ${DEFAULT_APP_PORT}.`
    );
}

export const APP_PORT = process.env.APP_PORT || DEFAULT_APP_PORT;
