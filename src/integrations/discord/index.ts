import * as logger from "@/core/logger";
import {
    DISCORD_SERVER_ID,
    DISCORD_TASKS_CHANNEL_ID,
    DISCORD_TOKEN,
} from "./config";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ],
});

// Servers

export async function getServerById(id: string) {
    await client.guilds.fetch(id);
    return client.guilds.cache.get(id);
}

// Channels

export async function getChannelById(id: string) {
    await client.channels.fetch(id);
    return client.channels.cache.get(id);
}

// Threads

export async function getThreadById(id: string) {
    // Load
    const channel = (await client.channels.fetch(
        DISCORD_TASKS_CHANNEL_ID!
    )) as TextChannel;
    await channel.threads.fetch();

    const thread = channel.threads.cache.get(id);

    return thread;
}

export async function getThreadByName(name: string) {
    // Load
    const channel = (await client.channels.fetch(
        DISCORD_TASKS_CHANNEL_ID!
    )) as TextChannel;
    await channel.threads.fetch();

    const thread = channel.threads.cache.find((thread) => thread.name === name);

    return thread;
}

export async function getThreadByNamePrefix(prefix: string) {
    // Load
    const channel = (await client.channels.fetch(
        DISCORD_TASKS_CHANNEL_ID!
    )) as TextChannel;
    await channel.threads.fetch();

    const thread = channel.threads.cache.find((thread) =>
        thread.name.startsWith(prefix)
    );

    return thread;
}

export async function openThread(name: string) {
    // Load
    const channel = (await client.channels.fetch(
        DISCORD_TASKS_CHANNEL_ID!
    )) as TextChannel;

    const thread = await channel.threads.create({
        name: name,
        autoArchiveDuration: 60 * 60 * 24 * 3,
        reason: `Task created: ${name}`,
    });

    logger.info(`Thread "${name}" created: ${thread.id}`);

    return thread;
}

export async function archiveThread(threadId: string) {
    const thread = await getThreadById(threadId);

    if (!thread) {
        throw new Error("Discord thread not found");
    }

    await thread.setArchived(true);

    logger.info(`Thread "${threadId}" archived`);
}

export async function unarchiveThread(threadId: string) {
    const thread = await getThreadById(threadId);

    if (!thread) {
        throw new Error("Discord thread not found");
    }

    await thread.setArchived(false);

    logger.info(`Thread "${threadId}" unarchived`);
}

// Messages

export async function sendMessageToThread(threadId: string, message: string) {
    const thread = await getThreadById(threadId);

    if (!thread) {
        throw new Error("Discord thread not found");
    }

    await thread.send(message);

    logger.info(`Message sent to thread "${threadId}"`);
}

// Members

export async function addMemberToThread(threadId: string, userId: string) {
    const thread = await getThreadById(threadId);

    if (!thread) {
        throw new Error("Discord thread not found");
    }

    await thread.members.add(userId);

    logger.info(`User "${userId}" added to thread "${threadId}"`);
}

export async function addMembersToThread(threadId: string, userIds: string[]) {
    for (const userId of userIds) {
        await addMemberToThread(threadId, userId);
    }
}

export async function getMemberRoles(memberId: string) {
    // Load all members of the server
    const server = await client.guilds.fetch(DISCORD_SERVER_ID!);
    await server.members.fetch();

    return server.members.cache.get(memberId)?.roles.cache.map((role) => ({
        name: role.name,
        id: role.id,
    }));
}

export async function getMembersByRoles(roleIds: string[]) {
    // Load all members of the server
    const server = await client.guilds.fetch(DISCORD_SERVER_ID!);
    await server.members.fetch();

    return server.members.cache
        .filter((member) =>
            roleIds.every((roleId) => member.roles.cache.get(roleId))
        )
        .map((member) => ({
            name: member.displayName,
            id: member.id,
        }));
}

// Integration

export async function setUpDiscordIntegration() {
    logger.info("Setting up Discord integration");

    if (!DISCORD_TOKEN) {
        throw new Error("DISCORD_TOKEN is not defined");
    }

    if (!DISCORD_TASKS_CHANNEL_ID) {
        throw new Error("DISCORD_TASKS_CHANNEL_ID is not defined");
    }

    if (!DISCORD_SERVER_ID) {
        throw new Error("DISCORD_SERVER_ID is not defined");
    }

    await client
        .login(DISCORD_TOKEN)
        .then(async () => {
            logger.info(`Logged in as ${client.user?.tag}`);

            const guild = await getServerById(DISCORD_SERVER_ID!);

            if (!guild) {
                throw new Error("Discord guild not found");
            }

            const channel = await getChannelById(DISCORD_TASKS_CHANNEL_ID!);

            if (!channel || !channel.isTextBased()) {
                throw new Error(
                    "Discord channel is not text based or not found"
                );
            }

            logger.info(`Discord channel "${channel.id}" is ready`);
        })
        .catch((error) => {
            logger.error("Failed to log in:", error);
        });
}
