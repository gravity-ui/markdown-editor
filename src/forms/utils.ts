export function enterKeyHandler<T>(
    handler: React.KeyboardEventHandler<T>,
): React.KeyboardEventHandler<T> {
    return (event) => {
        if (event.key === 'Enter') {
            handler(event);
        }
    };
}
