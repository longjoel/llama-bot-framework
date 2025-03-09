export type llamaMessage = {
    from: string;
    to: string;
    message: string;
    direction: boolean;
    timestamp: number;
};
export const toPng = (message: llamaMessage): string => {
    return `${message.timestamp}_${message.from}_${message.to}.png`;
};

export const toWav = (message: llamaMessage): string => {
    return `${message.timestamp}_${message.from}_${message.to}.wav`;
};
