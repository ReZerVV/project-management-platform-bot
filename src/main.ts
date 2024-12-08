import dotenv from "dotenv";
dotenv.config();

import { setUpIntegrations } from "./integrations";
import { setUpHttpServer } from "./core/http";
import { setGitlabEventHandler } from "./integrations/gitlab";
import { gitlabIssueToDiscordThreads } from "./commands/gitlab-issue-to-discord-threads";
import {
    PC_DISCORD_ROLE_ID,
    SV_DISCORD_ROLE_ID,
    SUBTEAM1_DISCORD_ROLE_ID,
    SUBTEAM2_DISCORD_ROLE_ID,
} from "./config";

async function setUp() {
    await setUpIntegrations();
    await setUpHttpServer();

    if (!PC_DISCORD_ROLE_ID) {
        throw new Error("PC_DISCORD_ROLE_ID is not defined");
    }

    if (!SV_DISCORD_ROLE_ID) {
        throw new Error("SV_DISCORD_ROLE_ID is not defined");
    }

    if (!SUBTEAM1_DISCORD_ROLE_ID) {
        throw new Error("SUBTEAM1_DISCORD_ROLE_ID is not defined");
    }

    if (!SUBTEAM2_DISCORD_ROLE_ID) {
        throw new Error("SUBTEAM2_DISCORD_ROLE_ID is not defined");
    }

    setGitlabEventHandler(gitlabIssueToDiscordThreads);
}

setUp();
