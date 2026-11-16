import {useLayoutEffect, useState} from 'react';

import {ViewerTargets} from '@gravity-ui/markdown-viewer';
import {Button, Text, sp} from '@gravity-ui/uikit';

import {cn} from '../cn';

export function Feedback() {
    return (
        <ViewerTargets selector="[data-demo-block-id]" as="div">
            {(host) => <FeedbackContent host={host} />}
        </ViewerTargets>
    );
}

function FeedbackContent({host}: {host: HTMLElement}) {
    const [helpful, setHelpful] = useState(false);

    useLayoutEffect(() => {
        const fallback = host.parentElement?.querySelector<HTMLElement>(
            '[data-demo-block-fallback]',
        );
        if (!fallback) return undefined;
        const previous = fallback.hidden;
        fallback.hidden = true;
        return () => {
            fallback.hidden = previous;
        };
    }, [host]);

    return (
        <div className={cn('feedback', sp({p: 4}))}>
            <Text as="p">
                {helpful ? 'Thanks for your feedback!' : 'Was this section helpful?'}
            </Text>
            <Button onClick={() => setHelpful((value) => !value)}>
                {helpful ? 'Undo feedback' : 'Yes, it was helpful'}
            </Button>
        </div>
    );
}
