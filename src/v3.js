import { Ollama } from 'ollama';
import irc from 'irc';
import {BotFrameworkClient} from '../client/index.js';

import { argv } from 'process';

const botVars = {
    ollamaServer: process.env.OLLAMA_SERVER || 'http://vault:11434',
    ollamaApiKey: process.env.OLLAMA_API_KEY || null,
    ircServer: process.env.IRC_SERVER || 'vault',
    ircNick: argv[2] || process.env.IRC_NICK || 'llary',
    ircChannel: process.env.IRC_CHANNEL || '#bots',
    systemPrompt: process.env.PROMPT || 'Just do your best.',
    minimumReplyTo: process.env.MINIMUM_REPLY_TO || 1,
    minimumReplyDelay: process.env.MINIMUM_REPLY_DELAY || 2000,
    pokeConversationMessage: process.env.POKE_CONVERSATION_MESSAGE || 'It got quiet in here. What\'s going on?',
    pokeConversationInterval: process.env.POKE_CONVERSATION_INTERVAL || 1000 * 60 * 15,
}

const nickname = botVars.ircNick;
const systemPrompt = argv
    .join(' ')
    .split(nickname)[1] || botVars.systemPrompt;


const ircClient = new irc.Client(botVars.ircServer, botVars.ircNick, {
    debug: true,
    channels: ['#bots'],
});

var remoteClient = new Ollama({
    host: 'http://vault:11434',});

    /** ircClient, ollamaClient, name, thoughtPatterns, idleThoughts, activityLevel, mood, instructions */
const bot = new BotFrameworkClient(ircClient, remoteClient, botVars.ircNick,[],[],'reactive','neutral',[]);
