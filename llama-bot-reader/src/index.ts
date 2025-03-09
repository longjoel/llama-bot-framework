
import irc from 'irc';
import { llamaMessage } from './llamaMessage';
import { buildImage } from './image-generator';
import { buildAudio } from './sound-generator';

import fs from 'fs';
import path from 'path';
const { spawnSync } = require('child_process');

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

        setTimeout(timeStepFunction, 500);
    } else {

        setTimeout(timeStepFunction, 1000);
    }
}

timeStepFunction();

const videoClipGenerator = () => {

    // grab the first image and sound file from the output folder

    const firstWavFile = fs.readdirSync(path.join(__dirname, '..', 'output')).find((file) => file.endsWith('.wav'));
    const firstPngFile = fs.readdirSync(path.join(__dirname, '..', 'output')).find((file) => file.endsWith('.png')); 
    
    
    if (firstWavFile && firstPngFile) {
        const imagePath = path.join(__dirname, '..', 'output', firstPngFile);
        const audioPath = path.join(__dirname, '..', 'output', firstWavFile);
        const outputPath = path.join(__dirname, '..', 'output', Date.now() + '.mp4');
        
        const result = spawnSync('ffmpeg', [
            '-loop', '1',
            '-i', imagePath,
            '-i', audioPath,
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-strict', 'experimental',
            '-b:a', '192k',
            '-shortest',
            outputPath
        ]);
        
        if (result.error) {
            console.error('Error generating video:', result.error);
        } else {
            console.log('Generated video:', outputPath);
            fs.unlinkSync(imagePath);
            fs.unlinkSync(audioPath);
        }
    }


    // combine them into a single video clip

    setTimeout(videoClipGenerator, 1000);
};

videoClipGenerator();