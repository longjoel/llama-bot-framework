
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

let lastMessage:llamaMessage;// = messageHistory.at(-1);

client.addListener('message', function (from, to, message) {

    if (lastMessage) {

       lastMessage = { from, to, message, direction: lastMessage.from == from ? lastMessage.direction : !lastMessage.direction , timestamp:Date.now()} as llamaMessage;


    } else {
        lastMessage={ from, to, message, direction: false, timestamp:Date.now() };
    }
    messageHistory.push(lastMessage);


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

    // Get all files and sort them by timestamp (which is in the filename)
    const outputFiles = fs.readdirSync(path.join(__dirname, '..', 'output'));
    const baseNames = new Set();

    // Extract base names without extensions
    outputFiles.forEach(file => {
        const baseName = file.split('.')[0];
            baseNames.add(baseName);
        
    });

    // Get the oldest timestamp that has both wav and png files
    const firstMatchingBaseName = Array.from(baseNames)
        .sort()
        .find(baseName => 
            outputFiles.includes(`${baseName}.wav`) && 
            outputFiles.includes(`${baseName}.png`)
        );

    const firstWavFile = firstMatchingBaseName ? `${firstMatchingBaseName}.wav` : null;
    const firstPngFile = firstMatchingBaseName ? `${firstMatchingBaseName}.png` : null;
    
    if (firstWavFile && firstPngFile) {
        const imagePath = path.join(__dirname, '..', 'output', firstPngFile);
        const audioPath = path.join(__dirname, '..', 'output', firstWavFile);
        const outputPath = path.join(__dirname, '..', 'output', Date.now() + '.mp4');
        
        const result = spawnSync('ffmpeg', [
            '-loop', '1',
            '-i', imagePath,
            '-t', '3','-c:v', 'libx264',
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