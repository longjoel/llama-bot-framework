// This is just a very straight forward example of connecting ollama to irc, with no additional trappings.
import { Ollama } from "ollama";
import irc from "irc";

// A handy way to get environment variables with sane default values.
const botVars = {
    ollamaServer: process.env.OLLAMA_SERVER || 'http://localhost:11434',
    ircServer: process.env.IRC_SERVER || 'vault',
    ircNick: argv[2] || process.env.IRC_NICK || 'llary',
    ircChannel: process.env.IRC_CHANNEL || '#bots',
    systemPrompt: process.env.PROMPT || 'You are a derpy but helpful assistant.',
    model: process.env.MODEL || 'llama3.2',
}

// keep a history of the conversations
let chat = [];

// connect to IRC
const ircClient = new irc.Client(botVars.ircServer, botVars.ircNick, {
    debug: true,
    channels: [ircChannel],
});

// generate the remote client
var remoteClient = new Ollama({
    host: botVars.ollamaServer
});

// let's only send a message once we have recived one
ircClient.addListener(`message${botVars.ircChannel}`, (from, message) => {

    // don't talk to yourself
    if (from === botVars.ircNick) return;

    // pass along to the value to the chat
    chat.push({ role: 'user', content: `${from} to ${botVars.channels}: ${message}` });

    // send the chat to the bot, let them figure out what to di with it.
    remoteClient.chat({
        model: botVars.model,
        messages: chat,
        stream: false,
    }).then((response) => {

        // 
        console.log(response.message.content);
        chat.push(response.message);
        ircClient.say(botVars.ircChannel, response.message.content);
    });
});
