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
    replyTimerHandle;
    isProcessing;
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
    constructor(ircClient, ollamaClient, name, thoughtPatterns, idleThoughts, activityLevel, mood, instructions) {
        this.ircClient = ircClient;
        this.ollamaClient = ollamaClient;
        this.name = name;
        this.thoughtPatterns = thoughtPatterns;
        this.idleThoughts = idleThoughts;
        this.activityLevel = activityLevel;
        this.mood = mood;
        this.instructions = [...this.baseInstructions(), ...instructions];
        this.isProcessing = false;
        this.ircClient.addListener('message', (from, to, message) => {
            console.log(from);
            if (from === this.name)
                return;
            this.chatMessageHistory.push({ from, to, message, timestamp: new Date().toISOString() });
        });
        let baseInterval = 1000;
        switch (this.activityLevel) {
            case 'reactive':
                baseInterval = 0; // reply immedately when mentioned.
                break;
            case 'idle':
                break;
            case 'proactive':
                baseInterval = 1000 * 60; // 1 minute
                break;
            case 'random':
                baseInterval = baseInterval + (1000 * (Math.random() * 60));
                break;
        }
        this.replyTimerHandle = setInterval(() => {
            if (this.isProcessing) {
                return;
            }
            this.isProcessing = true;
            // if we are reactive, only reply if the message 
            if (this.activityLevel == 'reactive') {
                if (!this.chatMessageHistory.filter(msg => msg.message.includes(this.name))) {
                    return;
                }
            }
            console.log(this.chatMessageHistory.at(-1)?.from, this.name);
            // don't talk to yourself?
            if (this.chatMessageHistory.at(-1)?.from === this.name) {
                return;
            }
            // step 1 - build chat history to send to the ollama connection.
            let convoHistory = JSON.stringify(this.chatMessageHistory.slice(-10));
            // step 2, iterate over the thought patterns and apply them to the chat history.
            this.ollamaMessageHistory.push({ content: convoHistory, role: 'user' });
            this.ollamaClient.chat({
                stream: false, model: 'llama3.2', messages: [
                    { role: 'system', content: this.instructions.join('\n') },
                    ...this.ollamaMessageHistory.slice(-5)
                ]
            }).then(response => {
                if (!response.message.content.includes("<pass>")) {
                    this.ollamaMessageHistory.push(response.message);
                    this.ircClient.say(this.ircChannel, response.message.content);
                    this.chatMessageHistory.push({ from: this.name, to: '', message: response.message.content, timestamp: new Date().toISOString() });
                    this.isProcessing = false;
                }
            });
        }, 1000 * 10);
    }
    ;
    destroy() {
        this.ircClient.disconnect('bye', () => { process.exit(0); });
        this.ircClient.off('message', () => { });
        clearInterval(this.replyTimerHandle);
    }
}
