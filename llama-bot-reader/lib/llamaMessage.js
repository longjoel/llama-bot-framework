"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toWav = exports.toPng = void 0;
const toPng = (message) => {
    return `${message.timestamp}_${message.from}_${message.to}.png`;
};
exports.toPng = toPng;
const toWav = (message) => {
    return `${message.timestamp}_${message.from}_${message.to}.wav`;
};
exports.toWav = toWav;
