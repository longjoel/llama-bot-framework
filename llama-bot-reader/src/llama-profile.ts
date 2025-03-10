import path from 'path';
export interface llamaProfile {
    name: string;
    imagePath: string;
    voice: {
        name: string;
        speed: number;
        pitch: number;
        volume: number
    },
    fontPath: string;
}


export const profiles: llamaProfile[] = [
    {
        name: 'cranky-neighbor', imagePath: path.join(__dirname, '..', 'llama-images', 'cranky-neighbor.png'), voice: {
            name: 'en-dutch', speed: 150, pitch: 50, volume: 100
        }, fontPath: path.join(__dirname, '..', 'res', 'cranky-neighbor.ttf')
    }, {
        name: 'llana', imagePath: path.join(__dirname, '..', 'llama-images', 'llana.png'), voice: {
            name: 'en-french-4', speed: 80, pitch: 90, volume: 100
        }, fontPath: path.join(__dirname, '..', 'res', 'llana.ttf')
    },
];