/** */

import { LlamaPersona, LlamaProfile } from "../llama-common/main.ts";
import { Chat } from "@epi/ollama";

import { Client } from "@csha/irc";

export class LlamaIrcDaemon {
  profile: LlamaProfile;
  ircClient: Client;
  persona: LlamaPersona;

  constructor(LlamaProfile: LlamaProfile, LlamaPersona: LlamaPersona) {
    this.persona = LlamaPersona;
    this.profile = LlamaProfile;

    this.ircClient = new Client(
      this.profile.ircHost,
      this.profile.ircNick,
      {
        port: this.profile.ircPort,
        channels: this.profile.ircChannels,
      },
    );
  }

  async tick() {
    await Chat({
      API_URL: this.profile.modelServer,
      stream: false,
      model: this.profile.modelName,
      messages: [
        { role: "system", content: this.persona.toSystemPrompt() },
      ],
      options: {
        temperature: this.profile.modelTemperature,
      },
    });
  }
}

export function add(a: number, b: number): number {
  console.log("Hiya");
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}
