import { setUpDiscordIntegration } from "./discord";
import { setUpGitlabIntegration } from "./gitlab";

export async function setUpIntegrations() {
    await setUpGitlabIntegration();
    await setUpDiscordIntegration();
}
