import {
    gitlabMemberIdToSupervisorId,
    gitlabMemberToDiscordMemberId,
    projectCoordinatorDiscordMemeberId,
} from "@/config";
import {
    addMembersToThread,
    addMemberToThread,
    archiveThread,
    getThreadByName,
    getThreadByNamePrefix,
    openThread,
    sendMessageToThread,
    unarchiveThread,
} from "@/integrations/discord";
import {
    GitlabEvent,
    ObjectAttributesAction,
    ObjectAttributesState,
} from "@/integrations/gitlab";

function getUniqueDiscordThreadNamePrefixFromGitlabEvent(event: GitlabEvent) {
    return `${event.objectAttributes.id}#${event.objectAttributes.iid}`;
}

function getDiscordThreadNamePrefixFromGitlabEvent(event: GitlabEvent) {
    return `${event.objectAttributes.id}#${event.objectAttributes.iid} - ${event.objectAttributes.title}`;
}

function getAssigneeGitlabIdFromGitlabEvent(event: GitlabEvent) {
    return event.objectAttributes.assigneeId;
}

function getAssigneeDiscordMemeberIdByGitlabUserId(event: GitlabEvent) {
    return gitlabMemberToDiscordMemberId.get(
        getAssigneeGitlabIdFromGitlabEvent(event).toString()
    )!;
}

function getSubteamSupervisorDiscordMemberIdByGitlabUserId(event: GitlabEvent) {
    const assigneeGitlabId =
        getAssigneeGitlabIdFromGitlabEvent(event).toString();

    const supervisorGitlabId =
        gitlabMemberIdToSupervisorId.get(assigneeGitlabId)!;

    return gitlabMemberToDiscordMemberId.get(supervisorGitlabId)!;
}

export async function gitlabIssueToDiscordThreads(event: GitlabEvent) {
    // console.log(event);

    switch (event.objectAttributes.action) {
        case ObjectAttributesAction.Open:
            {
                const thread = await openThread(
                    getDiscordThreadNamePrefixFromGitlabEvent(event)
                );

                await addMemberToThread(
                    thread.id,
                    projectCoordinatorDiscordMemeberId
                );
            }
            break;
        case ObjectAttributesAction.Update:
            {
                const thread = await getThreadByNamePrefix(
                    getUniqueDiscordThreadNamePrefixFromGitlabEvent(event)
                );

                if (event.changes?.assignees !== undefined) {
                    await addMembersToThread(thread.id, [
                        getAssigneeDiscordMemeberIdByGitlabUserId(event),
                        getSubteamSupervisorDiscordMemberIdByGitlabUserId(
                            event
                        ),
                    ]);
                } else if (event.changes.labels !== undefined) {
                    const previousLabels = Object.values(
                        event.changes.labels.previous
                    ).map((label) => label.title);
                    const currentLabels = Object.values(
                        event.changes.labels.current
                    ).map((label) => label.title);

                    const removedLabels = previousLabels.filter(
                        (label) => !currentLabels.includes(label)
                    );
                    const addedLabels = currentLabels.filter(
                        (label) => !previousLabels.includes(label)
                    );

                    let message = "@here\n";

                    if (
                        removedLabels.length === 0 &&
                        addedLabels.length === 0
                    ) {
                        message += "No significant label changes.";
                    } else if (removedLabels.length === 0) {
                        message += `Changes: \`${addedLabels.join("`, `")}\``;
                    } else if (addedLabels.length === 0) {
                        message += `Changes: \`${removedLabels.join(
                            "`, `"
                        )}\` -> (removed)`;
                    } else {
                        message += `Changes: \`${removedLabels.join(
                            "`, `"
                        )}\` -> \`${addedLabels.join("`, `")}\``;
                    }

                    await sendMessageToThread(thread.id, message);
                }
            }
            break;
        case ObjectAttributesAction.Close:
            {
                const thread = await getThreadByName(
                    getUniqueDiscordThreadNamePrefixFromGitlabEvent(event)
                );

                await archiveThread(thread.id);
            }
            break;
    }
}
