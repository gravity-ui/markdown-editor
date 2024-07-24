import {Key} from '../shortcuts';

export function enterKeyHandler<T>(
    handler: React.KeyboardEventHandler<T>,
): React.KeyboardEventHandler<T> {
    return (event) => {
        if (event.key === Key.Enter) {
            handler(event);
        }
    };
}

export function escapeKeyHandler<T>(
    handler: React.KeyboardEventHandler<T>,
): React.KeyboardEventHandler<T> {
    return (event) => {
        if (event.key === Key.Esc) {
            handler(event);
        }
    };
}

export function combinedKeyHandler<T>(
    handlers: Record<string, React.KeyboardEventHandler<T>>,
): React.KeyboardEventHandler<T> {
    return (event) => {
        const handler = handlers[event.key];
        if (handler) {
            handler(event);
        }
    };
}
