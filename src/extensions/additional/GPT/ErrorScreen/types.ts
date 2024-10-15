export type PromptPreset<PromptData extends unknown = unknown> = {
    display: string;
    key: string;
    data?: PromptData;
    hotKey?: string;
};

export type CommonAnswer = {
    rawText: string;
};

export type GptRequestData<PromptData extends unknown = unknown> = {
    markup: string;
    customPrompt?: string;
    promptData?: PromptData;
};
