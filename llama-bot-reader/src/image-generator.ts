import fs from 'fs';
import path from 'path';

import { llamaMessage } from "./llamaMessage";
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

    let llary = await loadImage(path.join(__dirname,'..','llama-images','llary.png'));
    
    while(!llary.complete){}

    ctx.drawImage(llary,left.x, left.y,left.w,left.h);

    ctx.font = '64px "weird"';
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';

    ctx.fillText("My name is Llary the llama. I am an artificially intelligent llama,\nand I love causing problems. ", right.x, right.y+64, right.w);

    let outStream = fs.createWriteStream('x.png');
    let pngStream = canvas.createPNGStream();

    pngStream.pipe(outStream);



}

buildImage({} as llamaMessage);