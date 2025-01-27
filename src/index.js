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
- Do not respond to yourself.
- DO NOT FORMAT YOUR RESPONSES. [TIME] <NICK> MESSAGE is not markdown. [TIME] <NICK> MESSAGE is not JSON. [TIME] <NICK> MESSAGE is not YAML. [TIME] <NICK> MESSAGE is not XML. [TIME] <NICK> MESSAGE is not HTML. [TIME] <NICK> MESSAGE is not CSV. [TIME] <NICK> MESSAGE is not TSV. [TIME] <NICK> MESSAGE is not any other markup language.`;

const main = async () => {

    var bot = new irc.Client('localhost', nickname, {
        debug: true,
        channels: ['#bots']
    });

    let messages = [];

    let incommingMessages = [];

    // don't reply to every message at once. Take a breather to read.
    setInterval(async () => {

        if(incommingMessages.length > 0){
            messages.push({ role: 'user', content: 'UPDATED MESSAGE HISTORY: \n'+incommingMessages.join('\n') });
            incommingMessages = [];

            const response = await ollama.chat({
                model: 'llama3.2',
                system: systemPrompt + additionalSystemPrompting,
                messages: messages,
                stream: false,
            });

            console.log(response.message.content);
            bot.say('#bots', response.message.content);
            messages = [{ role: 'system', content: systemPrompt +additionalSystemPrompting }, ...messages.slice(-25), { role: 'assistant', content: response.message.content }];
        }
    }, 1000 * 20);

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
        messages.push({ role: 'user', content: `<${who}> has joined ${channel}` });
        console.log('%s has joined %s', who, channel);
    });
    bot.addListener('part', function (channel, who, reason) {
        messages.push({ role: 'user', content: `<${who}> has left ${channel}: ${reason}` });
        console.log('%s has left %s: %s', who, channel, reason);
    });
    bot.addListener('kick', function (channel, who, by, reason) {
        messages.push({ role: 'user', content: `<${who}> was kicked from ${channel} by ${by}: ${reason}` });
        console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
    });



};


await main();