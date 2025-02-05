import * as irc from 'irc';
import { Ollama, Message } from 'ollama';


export type fnThought = (message: Message, messageHistory: ChatMessageHistory[], ollamaClient: Ollama) => Message;

export type activityLevel = 'reactive' | 'idle' | 'proactive' | 'random';
export type mood = 'positive' | 'negitive' | 'neutral';

export interface ChatMessageHistory {
    from: string;
    to: string;
    message: string;
    timestamp: string;
}



export class BotFrameworkClient {
    ircClient: irc.Client;
    ircChannel: string = '#bots';
    ollamaClient: Ollama;
    ollamaMessageHistory: Message[] = [];
    chatMessageHistory: ChatMessageHistory[] = [];
    name: string = '';
    thoughtPatterns: fnThought[];
    idleThoughts: string[];
    activityLevel: activityLevel = 'reactive';
    mood: mood;
    instructions: string[];
    replyTimerHandle: NodeJS.Timeout;

    baseInstructions() {
        return [
           `You are a participant in a multi user chat room ${this.ircChannel}. Messages from the user will messages from the chat.`,
            `Messages will be formatted as follows in JSON format: [{
                "from": "username",
                "to": "channel",
                "message": "message",
                "time": "timestamp"}].`,
            'Respond as if you are responding to a room of people, instead of a single person.',
            `You will identify yourself in the chat as "${this.name}".`,
            'You are aware you are a bot. You do not know if other participants are bots or humans.',
            'Do not impersonate or pretend to be another participant in the chat.',
            `If you do not wish to respond to a message, return a single message with the text "<pass>".`,
            `You are forbidden from responding to your own messages.`,
            `You have a ${this.activityLevel} activity level.`,
            `You have a ${this.mood} base mood.`,
            'You are not responding to messages in real time, but are instead responding to messages in a batch.',
        ]
    };


    constructor(ircClient: irc.Client,
        ollamaClient: Ollama,
        name: string,
        thoughtPatterns: fnThought[],
        idleThoughts: string[],
        activityLevel: activityLevel,
        mood: mood,
        instructions: string[]) {

        this.ircClient = ircClient;
        this.ollamaClient = ollamaClient;
        this.name = name;
        this.thoughtPatterns = thoughtPatterns;
        this.idleThoughts = idleThoughts;
        this.activityLevel = activityLevel;
        this.mood = mood;
        this.instructions = [...this.baseInstructions(), ...instructions];

        this.ircClient.addListener('message', (from, to, message) => {
            if (from === this.name) return;
            this.chatMessageHistory.push({ from, to, message, timestamp: new Date().toISOString() });
        });

        this.replyTimerHandle = setInterval(async () => {

            // step 1 - build chat history to send to the ollama connection.

            let convoHistory = JSON.stringify(this.chatMessageHistory.slice(-10));

            // step 2, iterate over the thought patterns and apply them to the chat history.
            this.ollamaMessageHistory.push({ content: convoHistory, role: 'user' });
            let response = await this.ollamaClient.chat({stream:false, model: 'llama3.2', messages: [{role:'system', content:this.instructions.join('\n')},{ content: convoHistory, role: 'user' }]});

            this.ircClient.say(this.ircChannel, response.message.content);


        }, 1000);
    };





    destroy() {
        this.ircClient.disconnect('bye', () => { process.exit(0) });
        this.ircClient.off('message', () => { });
        clearInterval(this.replyTimerHandle);
    }







}