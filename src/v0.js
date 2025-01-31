// This is just a very straight forward example of connecting ollama to irc, with no additional trappings.
import ollama from "ollama";
import irc from "irc";

let chat = [];

const ircClient = new irc.Client('localhost', 'llama32', {
    debug: true,
    channels: ['#bots'],
});

ircClient.addListener('message#bots', (from, message) => {

    if(from === 'llama32') return;
    
    chat.push({ role: 'user', content: `${from} to #bots: ${message}` });

    ollama.chat({
        model: 'llama3.2',
        messages: chat,
        stream: false,
    }).then((response) => {
        console.log(response.message.content);
        chat.push(response.message);
        ircClient.say('#bots', response.message.content);
    });
});
