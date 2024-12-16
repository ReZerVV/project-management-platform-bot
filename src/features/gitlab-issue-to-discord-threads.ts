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
import { Collection, ThreadMember } from "discord.js";

function getUniqueDiscordThreadNamePrefixFromGitlabEvent(event: GitlabEvent) {
    return `${event.objectAttributes.iid}`;
}

function getDiscordThreadNamePrefixFromGitlabEvent(event: GitlabEvent) {
    return `${event.objectAttributes.iid} - ${event.objectAttributes.title}`;
}

function getAssigneeGitlabIdFromGitlabEvent(event: GitlabEvent) {
    return event.objectAttributes.assigneeId;
}

function gitlabIdToDiscordId(gitlabId: number) {
    return gitlabMemberToDiscordMemberId.get(gitlabId)!;
}

async function getDiscordMemberIdsByDevDiscordMemberId(devMemberId?: string) {
    const memberIds: string[] = [];

    const pcMembers = await getMembersByRoles([PC_DISCORD_ROLE_ID!]);

    for (const pcMember of pcMembers) {
        memberIds.push(pcMember.id);
    }

    if (!devMemberId) {
        return memberIds;
    }

    memberIds.push(devMemberId);

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

    return memberIds;
}

export async function gitlabIssueToDiscordThreads(event: GitlabEvent) {
    if (!isValidEvent(event)) {
        return;
    }

    if (event.objectAttributes.action === ObjectAttributesAction.Close) {
        const thread = await getThreadByNamePrefix(
            getUniqueDiscordThreadNamePrefixFromGitlabEvent(event)
        );

        if (!thread) {
            logger.warn("Thread not found");
            return;
        }

        await archiveThread(thread.id);
    }

    const thread =
        (await getThreadByNamePrefix(
            getUniqueDiscordThreadNamePrefixFromGitlabEvent(event)
        )) ??
        (await openThread(getDiscordThreadNamePrefixFromGitlabEvent(event)));

    // sync members
    const members = await getDiscordMemberIdsByDevDiscordMemberId(
        gitlabIdToDiscordId(getAssigneeGitlabIdFromGitlabEvent(event))
    );

    await thread.members.fetch();
    for (const [_, member] of await thread.members.cache.filter(
        (member) => !members.includes(member.id)
    )) {
        await thread.members.remove(member);
    }

    await addMembersToThread(thread.id, members);

    // send message
    let message =
        `@here\n` +
        `Link: ${event.objectAttributes.url}\n` +
        `State: ${event.objectAttributes.state}\n` +
        `Labels: ${Object.values(event.objectAttributes.labels)
            .map((label) => `${label.title}`)
            .join(", ")}\n`;

    await sendMessageToThread(thread.id, message);

    // update thread
    if (event.objectAttributes.state === ObjectAttributesState.Closed) {
        await archiveThread(thread.id);
        return;
    }

    if (event.objectAttributes.state === ObjectAttributesState.Opened) {
        await unarchiveThread(thread.id);
    }
}
