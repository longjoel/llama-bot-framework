"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const irc_1 = __importDefault(require("irc"));
const image_generator_1 = require("./image-generator");
const sound_generator_1 = require("./sound-generator");
let messageHistory = [];
const client = new irc_1.default.Client('vault', 'storyteller', {
    channels: ['#bots']
});
client.addListener('message', function (from, to, message) {
    const lastMessage = messageHistory.at(-1);
    if (lastMessage) {
        messageHistory.push({ from, to, message, direction: lastMessage.from == from ? lastMessage.direction : !lastMessage.direction, timestamp: Date.now() });
    }
    else {
        messageHistory.push({ from, to, message, direction: false, timestamp: Date.now() });
    }
});
const timeStepFunction = () => {
    if (messageHistory.length) {
        let message = messageHistory.pop();
        if (message) {
            // generate an image
            (0, image_generator_1.buildImage)(message);
            // generate a sound file
            (0, sound_generator_1.buildAudio)(message);
        }
        setTimeout(timeStepFunction, 500);
    }
    else {
        setTimeout(timeStepFunction, 1000);
    }
};
timeStepFunction();
