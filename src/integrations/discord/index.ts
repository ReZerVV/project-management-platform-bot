import * as logger from "@/core/logger";
import { DISCORD_TASKS_CHANNEL_ID, DISCORD_TOKEN } from "./config";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

function getChannel(): TextChannel | null {
    const channel = client.channels.cache.get(
        DISCORD_TASKS_CHANNEL_ID!
    ) as TextChannel;
    return channel || null;
}

export async function getThreadById(id: string) {
    const channel = getChannel();

    if (!channel) {
        throw new Error("Discord channel not found");
    }

    await channel.threads.fetch();

    const thread = channel.threads.cache.get(id);

    if (!thread) {
        throw new Error("Discord thread not found");
    }

    return thread;
}

export async function getThreadByName(name: string) {
    const channel = getChannel();

    if (!channel) {
        throw new Error("Discord channel not found");
    }

    await channel.threads.fetch();

    const thread = channel.threads.cache.find((thread) => thread.name === name);

    if (!thread) {
        throw new Error("Discord thread not found");
    }

    return thread;
}

export async function getThreadByNamePrefix(prefix: string) {
    const channel = getChannel();

    if (!channel) {
        throw new Error("Discord channel not found");
    }

    await channel.threads.fetch();

    const thread = channel.threads.cache.find((thread) =>
        thread.name.startsWith(prefix)
    );

    if (!thread) {
        throw new Error("Discord thread not found");
    }

    return thread;
}

export async function openThread(name: string) {
    const channel = getChannel();

    if (!channel) {
        throw new Error("Discord channel not found");
    }

    const thread = await channel.threads.create({
        name: name,
        autoArchiveDuration: 60,
        reason: `Task created: ${name}`,
    });

    logger.info(`Thread "${name}" created: ${thread.id}`);

    thread.members.add("457554163207766039");

    return thread;
}

export async function archiveThread(threadId: string) {
    const thread = await getThreadById(threadId);

    await thread.setArchived(true);

    logger.info(`Thread "${threadId}" archived`);
}

export async function unarchiveThread(threadId: string) {
    const thread = await getThreadById(threadId);

    await thread.setArchived(false);

    logger.info(`Thread "${threadId}" unarchived`);
}

export async function sendMessageToThread(threadId: string, message: string) {
    const thread = await getThreadById(threadId);

    await thread.send(message);

    logger.info(`Message sent to thread "${threadId}"`);
}

export async function addMemberToThread(threadId: string, userId: string) {
    const thread = await getThreadById(threadId);

    await thread.members.add(userId);

    logger.info(`User "${userId}" added to thread "${threadId}"`);
}

export async function addMembersToThread(threadId: string, userIds: string[]) {
    for (const userId of userIds) {
        await addMemberToThread(threadId, userId);
    }
}

export async function setUpDiscordIntegration() {
    logger.info("Setting up Discord integration");

    if (!DISCORD_TOKEN) {
        throw new Error("DISCORD_TOKEN is not defined");
    }

    if (!DISCORD_TASKS_CHANNEL_ID) {
        throw new Error("DISCORD_TASKS_CHANNEL_ID is not defined");
    }

    client.once("ready", async () => {
        logger.info(`Logged in as ${client.user?.tag}`);

        const channel = await client.channels.fetch(DISCORD_TASKS_CHANNEL_ID!);

        if (!channel || !channel.isTextBased()) {
            throw new Error("Discord channel is not text based or not found");
        }

        logger.info(`Discord channel "${channel.id}" is ready`);
    });

    client.login(DISCORD_TOKEN).catch((error) => {
        logger.error("Failed to log in:", error);
    });
}
