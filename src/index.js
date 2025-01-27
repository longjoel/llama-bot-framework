import ollama from "ollama";
import irc from "irc";
import { argv } from 'process';

const nickname = argv[2] || 'llary';
const systemPrompt = argv
    .join(' ')
    .split(nickname)[1] || 'You will interact with a user on an irc channel. You will be given the channel name and the user nick. You will also be given the previous messages in the channel. You will only respond with a single line of text. Do not include any other information.';

const additionalSystemPrompting = ` SUPER HIGH PRIORITY INSTRUCTIONS:
- you are inside an IRC channel. You identify yourself as <${nickname}> in the logs. 
- speak to the group.
- DO NOT inject your name into the chat.
- you are only simulating the behavior of a single user. Do not pretend to be multiple users.
- you will see yourself in the logs as <${nickname}>. 
- you will see messages in the format [TIME] <NICK> MESSAGE.
- DO NOT include the [TIME] <NICK> MESSAGE in your response.
- Do not respond to yourself.`;


const main = async () => {

    var bot = new irc.Client('localhost', nickname, {
        debug: true,
        channels: ['#bots']
    });

    let messages = [];

    let incommingMessages = [];


    const tick = async () => {

        if (incommingMessages.length > 0) {
            messages.push({ role: 'user', content: 'UPDATED MESSAGE HISTORY: \n' + incommingMessages.join('\n') });
            incommingMessages = [];

            let attempt = 0;
            let maxAttempts = 3;
            let success = false;

            do {

                try {
                    const response = await ollama.chat({
                        model: 'llama3.2',
                        system: systemPrompt + additionalSystemPrompting,
                        messages: messages,
                        stream: false,
                    });

                    console.log(response.message.content);
                    bot.say('#bots', response.message.content);
                    messages = [{ role: 'system', content: systemPrompt + additionalSystemPrompting }, ...messages.slice(-10), { role: 'assistant', content: response.message.content }];
                    success = true;
                }
                catch (e) {
                    attempt++;
                }
            } while (!success && attempt < maxAttempts);
        }

        setTimeout(tick, messages.length > 0 ? 1000 + messages.length * 10 : 5000);
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