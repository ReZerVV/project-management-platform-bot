export * from "./types";
import * as logger from "@/core/logger";
import { setWebhook } from "@/core/http/webhooks";
import { toCamelCaseMiddleware } from "@/core/http/middlewares/to-camel-case.middleware";
import { HttpRequest } from "@/core/http";
import { GitlabEvent } from "./types";

let gitlabEventHandler: GitlabEventHandler;
export type GitlabEventHandler = (event: GitlabEvent) => Promise<void> | void;
export function setGitlabEventHandler(handler: GitlabEventHandler) {
    gitlabEventHandler = handler;
}

export async function setUpGitlabIntegration() {
    logger.info("Setting up Gitlab integration");

    setWebhook("/gitlab", toCamelCaseMiddleware, async (req: HttpRequest) => {
        if (!gitlabEventHandler) {
            logger.warn("Gitlab event handler not set");
            return;
        }

        await gitlabEventHandler(req.body as GitlabEvent);
    });
}
