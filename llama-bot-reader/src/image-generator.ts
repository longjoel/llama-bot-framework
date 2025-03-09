import fs from 'fs';
import path from 'path';

import { llamaMessage, toPng } from "./llamaMessage";
import canvas, { Canvas, Image, loadImage, registerFont } from 'canvas';

registerFont(path.join(__dirname,'..','res','AngryBirdsPostcard-Regular.ttf'), {
    family:'weird'
});

class rect {
    x: number;
    y: number;
    w: number;
    h: number

    constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    shrink(pixels: number) {

        return new rect(this.x + pixels, this.y + pixels, this.w - pixels - pixels, this.h - pixels - pixels);

    }

    fill(ctx:canvas.CanvasRenderingContext2D, fillStyle:string) {
        ctx.fillStyle = fillStyle;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }

    split(ratio:number){

        const lwidth = Math.floor(this.w * ratio);
        const rwidth = this.w - lwidth;

        console.log(lwidth, rwidth);

        return [
            new rect(this.x, this.y, lwidth, this.h),
            new rect(this.x+ lwidth,this.y, rwidth,this.h )
        ]
    }
}

export async function buildImage(message: llamaMessage) {

    let canvasRect = new rect(0,0,1920,540);

    const canvas = new Canvas(canvasRect.w, canvasRect.h, "image");

    const ctx = canvas.getContext("2d");

    canvasRect.fill(ctx,'white');
    
    canvasRect.shrink(16).fill(ctx,'black');
    canvasRect.shrink(64).fill(ctx,'white');

    const [left,right] = canvasRect.shrink(64).split(.30)

    left.fill(ctx,'gray');
    right.fill(ctx,'white');

    let llary = await loadImage(path.join(__dirname,'..','llama-images',`${message.from}.png`));
    
    while(!llary.complete){}

    ctx.drawImage(llary,left.x, left.y,left.w,left.h);

    ctx.font = '64px "weird"';
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';

    let textRight = right.shrink(64);

    const words = message.message.substring(0,60*6).split(' ')
    let line = '';
    let y = textRight.y;
    const lineHeight = 70; // Adjust based on font size
    const maxWidth = 60; // Characters per line

    for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        if (testLine.length > maxWidth && line) {
            ctx.fillText(line, textRight.x, y, textRight.w);
            line = word;
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    // Draw the last line
    if (line) {
        ctx.fillText(line, textRight.x, y, textRight.w);
    }

     const outputFilename = toPng(message);
        const outputPath = path.join(__dirname, '..', 'output', outputFilename);

    let outStream = fs.createWriteStream(outputPath);
    let pngStream = canvas.createPNGStream();

    pngStream.pipe(outStream);



}

//buildImage({} as llamaMessage);