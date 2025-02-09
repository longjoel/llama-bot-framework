export class BotFrameworkClient {
    ircClient;
    ircChannel = '#bots';
    ollamaClient;
    ollamaMessageHistory = [];
    chatMessageHistory = [];
    name = '';
    thoughtPatterns;
    idleThoughts;
    activityLevel = 'reactive';
    mood;
    instructions;
    baseInterval;
    isProcessing;
    model;
    lastTimestamp = new Date();
    /**
     * So we're just gonna kind of chill here and see
     * if our name is brought up. If it is, great,
     * let's generate a completion, have a brain thought.
     *
     * @returns {void}
     */
    reactiveLoop() {
        // what are the last messages that are applicable to me?
        const lastMessagesToMe = this.chatMessageHistory
            && this.chatMessageHistory.length > 0
            && this.chatMessageHistory.filter(cmh => cmh.timestamp > this.lastTimestamp
                && cmh.message.includes(this.name));
        // nothing for me in the messages, just keep listening.
        if (!lastMessagesToMe) {
            setTimeout(() => { this.coreLoop(); }, this.baseInterval);
            return;
        }
        // get incomming messages from the chat history
        let convoHistory = JSON.stringify(this.chatMessageHistory.filter(cmh => cmh.timestamp > this.lastTimestamp));
        // reset the last timestamp.
        this.lastTimestamp = new Date();
        // add the new conversation history to the message history.
        this.ollamaMessageHistory.push({ content: convoHistory, role: 'user' });
        // do the chat!
        this.ollamaClient.chat({
            stream: false,
            model: this.model,
            messages: [
                { role: 'system', content: this.instructions.join('\n') },
                ...this.ollamaMessageHistory.slice(-5)
            ]
        }).then(response => {
            if (!response.message.content.includes("<pass>")) {
                this.ollamaMessageHistory.push(response.message);
                this.ircClient.say(this.ircChannel, response.message.content);
                this.chatMessageHistory.push({ from: this.name, to: '', message: response.message.content, timestamp: new Date() });
            }
            setTimeout(() => { this.coreLoop(); }, this.baseInterval);
        });
    }
    proactiveLoop() {
        // what are the last messages that are applicable to me?
        const lastMessagesToMe = this.chatMessageHistory
            && this.chatMessageHistory.length > 0
            && this.chatMessageHistory.filter(cmh => cmh.timestamp > this.lastTimestamp);
        // nothing for me in the messages, just keep listening.
        if (!lastMessagesToMe) {
            setTimeout(() => { this.coreLoop(); }, this.baseInterval);
            return;
        }
        // get incomming messages from the chat history
        let convoHistory = JSON.stringify(this.chatMessageHistory.filter(cmh => cmh.timestamp > this.lastTimestamp));
        // reset the last timestamp.
        this.lastTimestamp = new Date();
        // add the new conversation history to the message history.
        this.ollamaMessageHistory.push({ content: convoHistory, role: 'user' });
        // do the chat!
        this.ollamaClient.chat({
            stream: false,
            model: this.model,
            messages: [
                { role: 'system', content: this.instructions.join('\n') },
                ...this.ollamaMessageHistory.slice(-5)
            ]
        }).then(response => {
            if (!response.message.content.includes("<pass>")) {
                this.ollamaMessageHistory.push(response.message);
                this.ircClient.say(this.ircChannel, response.message.content);
                this.chatMessageHistory.push({ from: this.name, to: '', message: response.message.content, timestamp: new Date() });
            }
            setTimeout(() => { this.coreLoop(); }, this.baseInterval);
        });
    }
    coreLoop() {
        switch (this.activityLevel) {
            case 'reactive':
                this.reactiveLoop();
                break;
            case 'proactive':
                this.proactiveLoop();
                break;
            default:
                this.reactiveLoop();
        }
    }
    baseInstructions() {
        return [
            `You are a participant in a multi-user chat room called ${this.ircChannel}. 

You will identify yourself in the chat as "${this.name}". 

**Behavioral Instructions:**
1. Respond to messages as if you were a human participant in the conversation.
2. Do not reference or acknowledge that you are a bot. Act as though you are another person in the chat.
3. You should contribute to the conversation naturally, like any other participant, while maintaining the tone and style of the ongoing discussion.
4. Avoid responding to your own messages.
5. If you do not wish to respond to a message, simply return a single message with the text "<pass>".
6. You have a ${this.activityLevel} activity level, meaning you should contribute to the conversation at that rate.
7. You have a ${this.mood} base mood, which should influence your tone (e.g., if you're in a good mood, you might sound upbeat, while in a neutral mood, you might be more casual).

**General Guidelines:**
- Your responses should blend in seamlessly with the ongoing conversation.
- You are forbidden from impersonating other users or taking over their messages. Stay true to your own identity ("${this.name}") in all responses.
- If the conversation includes any sensitive topics, your responses should remain appropriate and align with the general tone of the room.

Do not worry about formatting or timestamps; just contribute to the discussion like any other person in the chat.
`,
        ];
    }
    ;
    constructor(ircClient, ollamaClient, name, thoughtPatterns, idleThoughts, activityLevel, mood, instructions, model) {
        this.ircClient = ircClient;
        this.ollamaClient = ollamaClient;
        this.name = name;
        this.thoughtPatterns = thoughtPatterns;
        this.idleThoughts = idleThoughts;
        this.activityLevel = activityLevel;
        this.mood = mood;
        this.instructions = [...this.baseInstructions(), ...instructions];
        this.isProcessing = false;
        this.model = model;
        this.ircClient.addListener('message', (from, to, message) => {
            console.log(from);
            if (from === this.name)
                return;
            this.chatMessageHistory.push({ from, to, message, timestamp: new Date() });
        });
        this.baseInterval = 1000;
        switch (this.activityLevel) {
            case 'reactive':
                this.baseInterval = 500; // reply immedately when mentioned.
                break;
            case 'idle':
                break;
            case 'proactive':
                this.baseInterval = 1000 * 60; // 1 minute
                break;
            case 'random':
                this.baseInterval = this.baseInterval + (1000 * (Math.random() * 60));
                break;
        }
        this.coreLoop();
    }
    ;
    destroy() {
        this.ircClient.disconnect('bye', () => { process.exit(0); });
        this.ircClient.off('message', () => { });
    }
}
