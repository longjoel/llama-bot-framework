import { llamaMessage, toWav } from "./llamaMessage";
import { } from 'fs';
import { join } from 'path'
import { spawnSync } from "child_process";

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
        const result = spawnSync('espeak-ng', [
            '-w', outputPath,
            '-v', 'en-us',  // Voice - can be customized
            '-s', '150',    // Speed - can be customized
            '-p', '50',     // Pitch - can be customized
            '-a', '100',    // Volume - can be customized
            `'${text}'`
        ], {
            shell: true,
            stdio: 'inherit'  // This will pipe stdout/stderr to the parent process
        });

        if (result.error) {
            console.error('Error executing espeak-ng:', result.error);
            return null;
        }

        if (result.status !== 0) {
            console.error('espeak-ng process exited with code:', result.status);
            console.error('stderr:', result.stderr.toString());
            return null;
        }

        return outputPath;
    } catch (error) {
        console.error('Failed to generate audio:', error);
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
