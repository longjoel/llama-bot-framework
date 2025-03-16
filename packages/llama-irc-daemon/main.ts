/** */

import { LlamaPersona, LlamaProfile } from "../llama-common/main.ts";
import { Chat } from "@epi/ollama";

import { Client } from "@irc/client";

export class IrcMessage {
  from: string = "";
  to: string = "";
  message: string = "";
  timestamp: Date = new Date();
  constructor(from: string, to: string, message: string) {
    this.from = from;
    this.to = to;
    this.message = message;
  }
}

export class ModelMessage {
  role: "system" | "user" | "assistant" = "assistant";
  content: string = "";
  constructor(role: "system" | "user" | "assistant", content: string) {
    this.role = role;
    this.content = content;
  }
}

export class LlamaIrcDaemon {
  profile: LlamaProfile;
  ircClient: Client;
  persona: LlamaPersona;

  chatMessageHistory: IrcMessage[] = [];
  modelMessageHistory: ModelMessage[] = [];

  constructor(LlamaProfile: LlamaProfile, LlamaPersona: LlamaPersona) {
    this.persona = LlamaPersona;
    this.profile = LlamaProfile;

    // create the IRC client
    this.ircClient = new Client(
      this.profile.ircHost,
      this.profile.ircNick,
      {
        port: this.profile.ircPort,
        channels: this.profile.ircChannels,
      },
    );

    // join each irc channel
    this.profile.ircChannels.forEach((channel) => {
      this.ircClient.join(channel);
    });

    // when a message is received, add it to the chat history
    this.ircClient.on("message", (from, to, message) => {
      if (to !== this.profile.ircNick) {
        this.chatMessageHistory.push(new IrcMessage(from, to, message));
      }
    });

    // start the model polling, but after 2000ms to let messages accumulate
    setTimeout(this.modelPoll,2000);
  }

  consumeMessageHistory(): ModelMessage[] {
    // Copy the last x messages sent to the model
    const modelMessages: ModelMessage[] = this.modelMessageHistory.slice(
      -this.profile.modelPollHistory,
    );

    // If there are IRC chat messages to process
    if (this.chatMessageHistory.length > 0) {
      // Get the last y messages from IRC chat
      const recentChatMessages = this.chatMessageHistory;

      // Format them into a single content string
      const chatContent = recentChatMessages
        .map((msg) =>
          `[${msg.timestamp.toISOString()}] ${msg.from}: ${msg.message}`
        )
        .join("\n");

      // Create and add a new user message containing the IRC chat history
      modelMessages.push(new ModelMessage("user", chatContent));
    }

    // Clear the IRC chat history
    this.chatMessageHistory = [];

    return modelMessages;
  }

  // Poll the model for a response
  async modelPoll() {
    const result = await Chat({
      API_URL: this.profile.modelServer,
      stream: false,
      model: this.profile.modelName,
      messages: [
        { role: "system", content: this.persona.toSystemPrompt() },
        ...this.consumeMessageHistory(),
      ],
      options: {
        temperature: this.profile.modelTemperature,
      },
    });

    // Add the model response to the model message history
    this.modelMessageHistory.push({ role: "assistant", content: result });

    setTimeout(await this.modelPoll, this.profile.modelPollRate);
  }
}
