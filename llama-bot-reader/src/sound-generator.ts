import { llamaMessage, toWav } from "./llamaMessage";
import { } from 'fs';
import { join } from 'path'
import { spawnSync } from "child_process";
import { profiles, llamaProfile } from './llama-profile';

export async function buildAudio(message: llamaMessage) {

    // we are going to use espeak-ng for this, somehow
    const text = message.message;
    const outputFilename = toWav(message);
    const outputPath = join(__dirname, '..', 'output', outputFilename);

    try {
        // Call espeak-ng with parameters
        // -w: output to WAV file
        // -v: voice selection
        // -s: speed (words per minute)
        // -p: pitch adjustment
        // -a: amplitude (volume)
        let profile = profiles.find(x => x.name == message.from);
        if (!profile) {
            profile = profiles[0];
        }
        const args = [
            '-w', outputPath,
            '-v', profile.voice.name,  // Voice - can be customized
            '-s', profile.voice.speed.toString(),    // Speed - can be customized
            '-p', profile.voice.pitch.toString(),     // Pitch - can be customized
            '-a', profile.voice.volume.toString(),    // Volume - can be customized
            `"`+text.replace(/[^\w\s.,?!]/g, '')+`"` // Strip special characters that espeak can't handle
        ]

        console.log('Executing espeak-ng with args:', args);
        const result = spawnSync('espeak-ng', args, {
            encoding: 'utf8',
            stdio: 'inherit'  // Use pipes instead of inherit for better error handling
        });



        if (result.error) {
            console.log('Error executing espeak-ng:', result.error);
            return null;
        }

        if (result.status !== 0) {
            console.log('espeak-ng process exited with code:', result.status);
            console.log('stderr:', result.stderr.toString());
            return null;
        }

        return outputPath;
    } catch (error) {
        console.log('Failed to generate audio:', error);
        return null;
    }


}

// buildAudio({
//     from: 'me',
//     to: 'you',
//     message: 'Hello, world!',
//     direction: true,
//     timestamp: Date.now()
// } as llamaMessage); // This is just to make the linter happy
