type TrackingOptions = {
    onConnect?: () => void;
    onDisconnect?: () => void;
};

type Dispose = () => void;

export function startTracking(elem: HTMLElement, options: TrackingOptions): Dispose {
    const document = elem.ownerDocument;

    let connected = document.contains(elem);

    const observer = new MutationObserver(() => {
        if (connected) {
            if (!document.contains(elem)) {
                connected = false;
                options.onDisconnect?.();
            }
        } else if (document.contains(elem)) {
            connected = true;
            options.onConnect?.();
        }
    });

    observer.observe(document.body, {childList: true, subtree: true});

    return () => {
        observer.disconnect();
    };
}
