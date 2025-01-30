import { Ollama } from 'ollama';

const ollama = new Ollama({
    host: 'http://localhost:11434',
});

console.log('Pulling models');

await ollama.pull({ model: 'llama3.2', force: true, stream: false });

console.log('Models pulled');

console.log('Seeding data');

const seedModel = async ({ modelName, systemPrompt }) => {
    await ollama.create({
        model: modelName,
        stream: false,
        from: 'llama3.2',
        system: systemPrompt
    });

}