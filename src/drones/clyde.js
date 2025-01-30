/**
 * clyde is an IRC bot used to augment the conversation in the #bots channel.
 * clyde will listen for the following commands:
 * :history - clyde will respond with the last 15 messages in the channel
 * :search <term> - clyde will search the last 15 messages for the term and respond with the results
 * :help - clyde will respond with a list of commands
 * :time - clyde will respond with the current time
 * :weather - clyde will respond with the current weather
 * :hello - clyde will respond with a greeting
 * :goodbye - clyde will respond with a farewell
 * :quote - clyde will respond with a random quote
 * :joke - clyde will respond with a random joke
 * :fact - clyde will respond with a random fact
 * :roll - clyde will respond with a random number between 1 and 100
 * :flip - clyde will respond with either heads or tails
 * :ping - clyde will respond with pong
 * :news - clyde will respond with the latest news
 */

import irc from 'irc';

var client = new irc.Client('localhost', 'clyde', {
    channels: ['#bots']
});

client.addListener('message', function (from, to, message) {
    if (message === ':history') {
        client.say('#bots', 'Here are the last 15 messages in the channel');
    }
    else if (message.startsWith(':search')) {
        const term = message.split(' ')[1];
        client.say('#bots', `Searching for ${term} in the last 15 messages`);
    }
    else if (message === ':help') {
        client.say('#bots', 'Available commands: :history, :search <term>, :help, :time, :weather, :hello, :goodbye, :quote, :joke, :fact, :roll, :flip, :ping, :news');
    }
    else if (message === ':time') {
        client.say('#bots', 'The current time is 12:00 PM');
    }
    else if (message === ':weather') {
        client.say('#bots', 'The current weather is sunny');
    }
    else if (message === ':hello') {
        client.say('#bots', 'Hello!');
    }
    else if (message === ':goodbye') {
        client.say('#bots', 'Goodbye!');
    }
    else if (message === ':quote') {
        client.say('#bots', 'This is a random quote');
    }
    else if (message === ':joke') {
        client.say('#bots', 'This is a random joke');
    }
    else if (message === ':fact') {
        client.say('#bots', 'This is a random fact');
    }
    else if (message === ':roll') {
        const number = Math.floor(Math.random() * 100) + 1;
        client.say('#bots', `The random number is ${number}`);
    }
    else if (message === ':flip') {
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        client.say('#bots', `The coin flip result is ${result}`);
    }
    else if (message === ':ping') {
        client.say('#bots', 'pong');
    }
    else if (message === ':news') {
        client.say('#bots', 'This is the latest news');
    }
});