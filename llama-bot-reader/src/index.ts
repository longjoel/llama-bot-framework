
import irc from 'irc';
import { llamaMessage } from './llamaMessage';
import { buildImage } from './image-generator';
import { buildAudio } from './sound-generator';

let messageHistory: llamaMessage[] = [];




const client = new irc.Client('vault', 'storyteller', {
    channels: ['#bots']
});

client.addListener('message', function (from, to, message) {

    const lastMessage = messageHistory.at(-1);
    if (lastMessage) {

        messageHistory.push({ from, to, message, direction: lastMessage.from == from ? lastMessage.direction : !lastMessage.direction , timestamp:Date.now()} as llamaMessage);

    } else {
        messageHistory.push({ from, to, message, direction: false, timestamp:Date.now() } as llamaMessage);
    }


});

const timeStepFunction = () => {

    if (messageHistory.length) {


        let message = messageHistory.pop();

        if (message) {

            // generate an image
            buildImage(message);
            
            
            // generate a sound file
            buildAudio(message);


        }

    } else {

        setTimeout(timeStepFunction, 1000);
    }
}

timeStepFunction();
