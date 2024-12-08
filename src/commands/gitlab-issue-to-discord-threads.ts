import * as logger from "@/core/logger";
import {
    gitlabMemberToDiscordMemberId,
    PC_DISCORD_ROLE_ID,
    SUBTEAM1_DISCORD_ROLE_ID,
    SUBTEAM2_DISCORD_ROLE_ID,
    SV_DISCORD_ROLE_ID,
} from "@/config";
import {
    addMembersToThread,
    archiveThread,
    getMembersByRoles,
    getMemberRoles,
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
import { isValidEvent } from "./gitlab-issue-filter";

function getUniqueDiscordThreadNamePrefixFromGitlabEvent(event: GitlabEvent) {
    return `${event.objectAttributes.id}#${event.objectAttributes.iid}`;
}

function getDiscordThreadNamePrefixFromGitlabEvent(event: GitlabEvent) {
    return `${event.objectAttributes.id}#${event.objectAttributes.iid} - ${event.objectAttributes.title}`;
}

function getAssigneeGitlabIdFromGitlabEvent(event: GitlabEvent) {
    return event.objectAttributes.assigneeId;
}

function gitlabIdToDiscordId(gitlabId: number) {
    return gitlabMemberToDiscordMemberId.get(gitlabId)!;
}

async function getDiscordMemberIdsByDevDiscordMemberId(devMemberId: string) {
    const memberIds: string[] = [devMemberId];

    const devRoles = await getMemberRoles(devMemberId);

    if (!devRoles) {
        return memberIds;
    }

    const subteamRole = devRoles.find(
        (role) =>
            role.id === SUBTEAM1_DISCORD_ROLE_ID ||
            role.id === SUBTEAM2_DISCORD_ROLE_ID
    );

    if (!subteamRole) {
        logger.warn("Subteam role not found");
        return memberIds;
    }

    const svMembers = await getMembersByRoles([
        subteamRole.id,
        SV_DISCORD_ROLE_ID!,
    ]);

    for (const svMember of svMembers) {
        memberIds.push(svMember.id);
    }

    const pcMembers = await getMembersByRoles([PC_DISCORD_ROLE_ID!]);

    for (const pcMember of pcMembers) {
        memberIds.push(pcMember.id);
    }

    return memberIds;
}

export async function gitlabIssueToDiscordThreads(event: GitlabEvent) {
    if (!isValidEvent(event)) {
        return;
    }

    switch (event.objectAttributes.action) {
        case ObjectAttributesAction.Open:
            {
                const thread = await openThread(
                    getDiscordThreadNamePrefixFromGitlabEvent(event)
                );

                await addMembersToThread(
                    thread.id,
                    (
                        await getMembersByRoles([PC_DISCORD_ROLE_ID!])
                    ).map((member) => member.id)
                );
            }
            break;
        case ObjectAttributesAction.Update:
            {
                let thread = await getThreadByNamePrefix(
                    getUniqueDiscordThreadNamePrefixFromGitlabEvent(event)
                );

                if (thread === undefined) {
                    if (
                        event.changes.stateId !== undefined &&
                        event.objectAttributes.state ===
                            ObjectAttributesState.Closed
                    ) {
                        logger.warn("Thread not found");
                        break;
                    }

                    thread = await openThread(
                        getDiscordThreadNamePrefixFromGitlabEvent(event)
                    );

                    await addMembersToThread(
                        thread.id,
                        event.objectAttributes.assigneeId
                            ? await getDiscordMemberIdsByDevDiscordMemberId(
                                  gitlabIdToDiscordId(
                                      getAssigneeGitlabIdFromGitlabEvent(event)
                                  )
                              )
                            : (
                                  await getMembersByRoles([PC_DISCORD_ROLE_ID!])
                              ).map((member) => member.id)
                    );
                }

                if (event.changes.stateId !== undefined) {
                    if (
                        event.objectAttributes.state ===
                        ObjectAttributesState.Closed
                    ) {
                        await archiveThread(thread.id);
                        break;
                    }

                    if (
                        event.objectAttributes.state ===
                        ObjectAttributesState.Opened
                    ) {
                        await unarchiveThread(thread.id);
                    }
                }

                if (
                    event.changes?.assignees !== undefined &&
                    event.objectAttributes.assigneeId !== null
                ) {
                    await addMembersToThread(
                        thread.id,
                        await getDiscordMemberIdsByDevDiscordMemberId(
                            gitlabIdToDiscordId(
                                getAssigneeGitlabIdFromGitlabEvent(event)
                            )
                        )
                    );
                }

                if (event.changes.labels !== undefined) {
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

                if (!thread) {
                    logger.warn("Thread not found");
                    break;
                }

                await archiveThread(thread.id);
            }
            break;
    }
}
