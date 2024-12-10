import { GitlabEvent } from "@/integrations/gitlab";

export function isValidEvent(event: GitlabEvent) {
    return Object.values(event.labels).some((label) => label.title === "team2");
}
