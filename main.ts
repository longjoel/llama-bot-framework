import process from "node:process";
import fs from "node:fs";

import { LlamaPersona, LlamaProfile } from "./packages/llama-common/main.ts";
import { LlamaIrcDaemon } from "./packages/llama-irc-daemon/main.ts";

interface CommandLineOptions {
  daemon: boolean;
  narrator: boolean;
  profile: string | null; // Path to the profile JSON file
  persona: string | null; // Path to the persona JSON file
}

function parseCommandLineArguments(): CommandLineOptions {
  const args = process.argv.slice(2);

  const options: CommandLineOptions = {
    daemon: false,
    narrator: false,
    profile: null,
    persona: null,
  };

  // Set daemon as default if no args provided
  if (args.length === 0) {
    options.daemon = true;
    return options;
  }

  // Parse arguments
  for (const arg of args) {
    if (arg === "--daemon") {
      options.daemon = true;
    } else if (arg === "--narrator") {
      options.narrator = true;
    }

    if (arg.startsWith("--profile=")) {
      options.profile = arg.split("=")[1];
    }
    if (arg.startsWith("--persona=")) {
      options.persona = arg.split("=")[1];
    }

    if (options.profile && fs.existsSync(options.profile) === false) {
      console.log(options.profile);
      throw new Error("Profile file does not exist");
    }
    if (options.persona && fs.existsSync(options.persona) === false) {
      throw new Error("Persona file does not exist");
    }
  }

  // If neither option was explicitly set, use daemon as default
  if (!options.daemon && !options.narrator) {
    options.daemon = true;
  }

  return options;
}

async function runAsDaemon(profile: LlamaProfile, persona: LlamaPersona) {
  console.log("Running as LLM bot daemon");
  const daemon = new LlamaIrcDaemon(profile, persona);

  const daemonTimeout = async () => {
    await daemon.modelPoll();
    setTimeout(daemonTimeout, 2000);
  };
  setTimeout(daemonTimeout, profile.modelPollRate);

}

//TODO: Implement runAsNarrator function
async function runAsNarrator(profile: LlamaProfile, persona: LlamaPersona) {
  console.log("Running as IRC narrator connected to llama video compiler");
  // TODO: Implement IRC narrator functionality
}

async function main() {
  const options = parseCommandLineArguments();

  const profile = options.profile
    ? JSON.parse(
      fs.readFileSync(options.profile).toString(),
    ) as LlamaProfile
    : null;
  const persona = options.persona
    ? JSON.parse(
      fs.readFileSync(options.persona).toString(),
    ) as LlamaPersona
    : null;

  if (options.narrator && profile && persona) {
    await runAsNarrator(profile, persona);
  } else if (options.daemon && profile && persona) {
    await runAsDaemon(profile, persona);
  } else {
    throw new Error("Invalid options");
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
