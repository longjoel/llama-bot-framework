/** */
import { LlamaPersona } from "../llama-common/main.ts";
import type {  LlamaProfile } from "../llama-common/main.ts";
import { Chat } from "@epi/ollama";

import { Client } from "irc";

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
  ircConnection: Deno.Conn | null = null;
  persona: LlamaPersona;

  chatMessageHistory: IrcMessage[] = [];
  modelMessageHistory: ModelMessage[] = [];

  constructor(llamaProfile: LlamaProfile, llamaPersona: LlamaPersona) {
    this.persona = llamaPersona;
    this.profile = llamaProfile;

    // create the IRC client
    this.ircClient = new Client(this.profile.ircHost, this.profile.ircNick, {
      channels: this.profile.ircChannels,
      debug: true,
    });

    // listen to incomming messages.
    this.ircClient.addListener("message", (from, to, message) => {
      if (from !== this.profile.ircNick) {
        this.chatMessageHistory.push(new IrcMessage(from, to, message));
      }
    });
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
  public async modelPoll() {

    if (this.persona && this.chatMessageHistory.length > 0) {


      const msgHistory = this.consumeMessageHistory();
      const result = await Chat({
        API_URL: this.profile.modelServer,
        stream: false,
        model: this.profile.modelName,
        messages: [
          {
            role: "system",
            content: LlamaPersona.toSystemPrompt(this.persona),
          },
          ...msgHistory,
        ],
        options: {
          temperature: this.profile.modelTemperature,
        },
      });

      if (result) {
        this.modelMessageHistory.push({ role: "assistant", content: result });
        this.ircClient.say("#bots", result);
      }
    }
  }
}
