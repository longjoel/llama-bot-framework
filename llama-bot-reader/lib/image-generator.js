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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildImage = buildImage;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const llamaMessage_1 = require("./llamaMessage");
const canvas_1 = require("canvas");
(0, canvas_1.registerFont)(path_1.default.join(__dirname, '..', 'res', 'AngryBirdsPostcard-Regular.ttf'), {
    family: 'weird'
});
class rect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    shrink(pixels) {
        return new rect(this.x + pixels, this.y + pixels, this.w - pixels - pixels, this.h - pixels - pixels);
    }
    fill(ctx, fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
    split(ratio) {
        const lwidth = Math.floor(this.w * ratio);
        const rwidth = this.w - lwidth;
        console.log(lwidth, rwidth);
        return [
            new rect(this.x, this.y, lwidth, this.h),
            new rect(this.x + lwidth, this.y, rwidth, this.h)
        ];
    }
}
function buildImage(message) {
    return __awaiter(this, void 0, void 0, function* () {
        let canvasRect = new rect(0, 0, 1920, 540);
        const canvas = new canvas_1.Canvas(canvasRect.w, canvasRect.h, "image");
        const ctx = canvas.getContext("2d");
        canvasRect.fill(ctx, 'white');
        canvasRect.shrink(16).fill(ctx, 'black');
        canvasRect.shrink(64).fill(ctx, 'white');
        const [left, right] = canvasRect.shrink(64).split(.30);
        left.fill(ctx, 'gray');
        right.fill(ctx, 'white');
        let llary = yield (0, canvas_1.loadImage)(path_1.default.join(__dirname, '..', 'llama-images', `${message.from}.png`));
        while (!llary.complete) { }
        ctx.drawImage(llary, left.x, left.y, left.w, left.h);
        ctx.font = '64px "weird"';
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.fillText(message.message, right.x, right.y + 64, right.w);
        const outputFilename = (0, llamaMessage_1.toPng)(message);
        const outputPath = path_1.default.join(__dirname, '..', 'output', outputFilename);
        let outStream = fs_1.default.createWriteStream(outputPath);
        let pngStream = canvas.createPNGStream();
        pngStream.pipe(outStream);
    });
}
//buildImage({} as llamaMessage);
