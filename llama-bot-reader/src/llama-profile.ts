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
        name: 'default', imagePath: path.join(__dirname, '..', 'llama-images', 'glitch.png'), voice: {
            name: 'en-us', speed: 150, pitch: 50, volume: 100
        }, fontPath: path.join(__dirname, '..', 'res', 'glitch.ttf')
    },
    {
        name: 'walter', imagePath: path.join(__dirname, '..', 'llama-images', 'cranky-neighbor.png'), voice: {
            name: 'en-dutch', speed: 150, pitch: 50, volume: 100
        }, fontPath: path.join(__dirname, '..', 'res', 'cranky-neighbor.ttf')
    }, {
        name: 'lana', imagePath: path.join(__dirname, '..', 'llama-images', 'llana.png'), voice: {
            name: 'en-french-4', speed: 80, pitch: 90, volume: 100
        }, fontPath: path.join(__dirname, '..', 'res', 'llana.ttf')
    }, {
        name: 'lucy', imagePath: path.join(__dirname, '..', 'llama-images', 'llucy.png'), voice: {
            name: 'en-sweedish-f', speed: 80, pitch: 90, volume: 100
        }, fontPath: path.join(__dirname, '..', 'res', 'misbhvn.ttf')
    },
];