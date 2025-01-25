import { Ollama } from "ollama";
import NodeIRC from "irc";

const main  = async ()=>{

    const ollamaClient = new Ollama({
        host:'http://localhost:11434'
    });

    const ircClient = new NodeIRC.Client("localhost:6667","llary-the-llama");

    ircClient.addListener('message#bots', function (from, message) {
        console.log(from + ' => #bots: ' + message);
    });

    ircClient.join('#bots');


    ircClient.say('#bots', "I'm a bot!");


};


main();