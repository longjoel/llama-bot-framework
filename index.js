import ollama from "ollama";
import irc from "irc";
import { argv } from 'process';

const nickname = argv[2] || 'llary';
const systemPrompt = argv.slice(3).join(' ') || 'You will interact with a user on an irc channel. You will be given the channel name and the user nick. You will also be given the previous messages in the channel. You will only respond with a single line of text. Do not include any other information.';

const main = async () => {

    var bot = new irc.Client('localhost', nickname, {
        debug: true,
        channels: ['#bots', '#othertest']
    });

    let messages = [];

    // don't reply to every message at once. Take a breather to read.
    setInterval(async () => {
        const response = await ollama.chat({
            model: 'llama3.2',
            system: systemPrompt,
            messages: messages,
            stream: false,
        });

        console.log(response.message.content);
        bot.say('#bots', response.message.content);
        messages = [{ role: 'system', content: systemPrompt }, ...messages.slice(-25), { role: 'assistant', content: response.message.content }];
    }, 1000 * 20);

    bot.addListener('error', function (message) {
        console.error('ERROR: %s: %s', message.command, message.args.join(' '));
        messages.push({ role: 'user', content: `<${message.command}> ${message.args.join(' ')}` });

    });


    bot.addListener('message#bots', async function (from, message) {
        console.log('<%s> %s', from, message);


        messages.push({ role: 'user', content: `<${from}> ${message}` });


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