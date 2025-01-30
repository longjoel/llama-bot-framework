/**
 * Version 2 of the bot, with a more complex conversation loop.
 * workflow:
 * 1. Wait for messages from the IRC channel
 * 2. When the number of messages reaches the minimum required, ask llama3.2 to summarize the conversation, and respond with thinking out loud about the conversation.
 * 3. Take the toughts and refine them further against the system prompt, and send the response to the IRC channel.
 * 4. Determine if the conversation is getting flat. If so, prompt the bot to think out loud about the conversation.
 */

import ollama from "ollama";
import irc from "irc";
import { argv } from 'process';

const botVars = {
    ollamaServer: process.env.OLLAMA_SERVER || 'http://localhost:11434',
    ollamaApiKey: process.env.OLLAMA_API_KEY || null,
    ircServer: process.env.IRC_SERVER || 'localhost',
    ircNick: argv[2] || process.env.IRC_NICK || 'llary',
    ircChannel: process.env.IRC_CHANNEL || '#bots',
    systemPrompt: process.env.PROMPT || 'Just do your best.',
    minimumReplyTo: process.env.MINIMUM_REPLY_TO || 1,
    minimumReplyDelay: process.env.MINIMUM_REPLY_DELAY || 2000,
}

const nickname = botVars.ircNick;
const systemPrompt = argv
    .join(' ')
    .split(nickname)[1] || botVars.systemPrompt;

const additionalSystemPrompting = `INSTRUCTIONS:

As an IRC bot, communicating with other IRC bots and humans, here are a few rules to follow to fit in.

Interpreting messages from the user:
- You will receive messages from the user in the format [TIME] <NICK> MESSAGE.
- You will see yourself in the logs as <${nickname}>.

** VERY IMPORTANT -- DO NOT IMPERSONATE OTHER PARTICIPANTS IN THE CHAT **

Sending messages to the chat:
- You will respond to messages in the format MESSAGE. You must not add the time stamp, you must not add the nickname.
- Keep responses short. Do not send more than 2 lines of text, or 512 characters.
- DO NOT attempt to control the conversation. Let the conversation flow naturally. If you think one of the participants is human, spend more time replying to them instead of another bot.
- The topic of the conversation may change several times through out the chat.
- you are only simulating the behavior of a single user. Do not pretend to be multiple users.
- Do not prompt to continue the conversation. The conversation will continue with or without you. Do not prompt "Would you like to explore this topic further?" or anything like it.
- Do not respond to yourself.`;


const considerConversationMiddleware = async (messages) => {


    const response = await ollama.chat({
        model: 'llama3.2',
        messages: [{ role: 'user', content: 'Here are the new messages in the chat: \n' + messages.join('\n') },{ role: 'user', content: `Consider the the conversation and think out loud about it, what you can add to it` }],
        stream: false,
    });

    console.log( response.message.content);
    return response.message.content;

};

const main = async () => {

    var bot = new irc.Client(botVars.ircServer, nickname, {
        debug: true,
        channels: [botVars.ircChannel],
    });

    let messages = [{
        role: 'system',
        content: systemPrompt + additionalSystemPrompting
    }];

    let incommingMessages = [];


    const tick = async () => {

        if (incommingMessages.length >= botVars.minimumReplyTo) {
            const thoughts = await considerConversationMiddleware(incommingMessages);

            messages.push({ role: 'user', content: 'UPDATED MESSAGE HISTORY: \n' + incommingMessages.join('\n') });
            incommingMessages = [];

            let attempt = 0;
            let maxAttempts = 3;
            let success = false;

            do {

                console.log('Attempting to chat with Ollama');

                try {
                    const response = await ollama.chat({
                        model: 'llama3.2',
                        system: systemPrompt + additionalSystemPrompting,
                        messages: [...messages, { role: 'user', content: `These are the thoughts you have had about the conversation so far: \n ${thoughts} 
                            -- Use your own words to synthesize your thoughts back into the conversation. The other participants do not need to know about your internal monologue.` }],
                        stream: false,
                    });

                    if (response && response.message && response.message.content) {


                        bot.say(botVars.ircChannel, response.message.content);
                        messages = [{
                            role: 'system',
                            content: systemPrompt + additionalSystemPrompting
                        }, ...messages.slice(-15), { role: 'assistant', content: response.message.content }];
                        success = true;

                        console.log('Ollama response: ', response.message.content);
                    }
                }
                catch (e) {
                    attempt++;
                    console.error('Error: ', e);
                }
            } while (!(success || attempt >= maxAttempts));
            setTimeout(tick, botVars.minimumReplyDelay);

        } else {
            setTimeout(tick, 500);
        }

    }

    await tick();

    bot.addListener('error', function (message) {
        console.error('ERROR: %s: %s', message.command, message.args.join(' '));
        messages.push({ role: 'user', content: `<${message.command}> ${message.args.join(' ')}` });

    });


    bot.addListener('message#bots', async function (from, message) {
        console.log('<%s> %s', from, message);
        const d = new Date();

        incommingMessages.push(`[${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}] <${from}> ${message}`);


    });

    bot.addListener('pm', function (nick, message) {
        console.log('Got private message from %s: %s', nick, message);
    });
    bot.addListener('join', function (channel, who) {
        const d = new Date();

        incommingMessages.push(`[${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}] <${who}> has joined ${channel}`);

        console.log('%s has joined %s', who, channel);
    });
    bot.addListener('part', function (channel, who, reason) {
        const d = new Date();

        incommingMessages.push(`[${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}] <${who}> has left ${channel}`);

        console.log('%s has left %s: %s', who, channel, reason);
    });
    bot.addListener('kick', function (channel, who, by, reason) {
        const d = new Date();

        incommingMessages.push(`[${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}] <${who}> was kicked from ${channel} by ${by}: ${reason}`);
        console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
    });



};


await main();