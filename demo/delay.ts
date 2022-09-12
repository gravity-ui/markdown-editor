function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function randomDelay(from: number, to: number): Promise<void> {
    const ms = randomInt(from, to);
    return delay(ms);
}
