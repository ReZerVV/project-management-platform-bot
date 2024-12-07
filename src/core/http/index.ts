import * as logger from "@/core/logger";
import express from "express";
import bodyParser from "body-parser";
import { APP_PORT } from "./config";
import { setUpWebhooks } from "./webhooks";

export type HttpServer = express.Express;
export type HttpRequest = express.Request;
export type HttpResponse = express.Response;

export async function setUpHttpServer() {
    const app = express();

    app.use(bodyParser.json());

    await setUpWebhooks(app);

    app.listen(APP_PORT, () => {
        logger.info(`Server is running on port ${APP_PORT}`);
    });
}
