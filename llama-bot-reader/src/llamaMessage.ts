export type llamaMessage = {
    from: string;
    to: string;
    message: string;
    direction: boolean;
    timestamp: number;
};
