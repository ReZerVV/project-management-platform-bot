import dotenv from "dotenv";
dotenv.config();

import { setUpIntegrations } from "./integrations";
import { setUpHttpServer } from "./core/http";
import { setGitlabEventHandler } from "./integrations/gitlab";
import { gitlabIssueToDiscordThreads } from "./actions/gitlab-issue-to-discord-threads";

async function setUp() {
    await setUpIntegrations();
    await setUpHttpServer();

    setGitlabEventHandler(gitlabIssueToDiscordThreads);
}

setUp();
