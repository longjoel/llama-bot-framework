"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAudio = buildAudio;
const llamaMessage_1 = require("./llamaMessage");
const path_1 = require("path");
const child_process_1 = require("child_process");
function buildAudio(message) {
    return __awaiter(this, void 0, void 0, function* () {
        // we are going to use espeak-ng for this, somehow
        const text = message.message;
        const outputFilename = (0, llamaMessage_1.toWav)(message);
        const outputPath = (0, path_1.join)(__dirname, '..', 'output', outputFilename);
        try {
            // Call espeak-ng with parameters
            // -w: output to WAV file
            // -v: voice selection
            // -s: speed (words per minute)
            // -p: pitch adjustment
            // -a: amplitude (volume)
            const result = (0, child_process_1.spawnSync)('espeak-ng', [
                '-w', outputPath,
                '-v', 'en-us', // Voice - can be customized
                '-s', '150', // Speed - can be customized
                '-p', '50', // Pitch - can be customized
                '-a', '100', // Volume - can be customized
                `'${text}'`
            ], {
                shell: true,
                stdio: 'inherit' // This will pipe stdout/stderr to the parent process
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
        }
        catch (error) {
            console.error('Failed to generate audio:', error);
            return null;
        }
    });
}
// buildAudio({
//     from: 'me',
//     to: 'you',
//     message: 'Hello, world!',
//     direction: true,
//     timestamp: Date.now()
// } as llamaMessage); // This is just to make the linter happy
