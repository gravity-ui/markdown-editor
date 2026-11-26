import {useState} from 'react';

import {ViewerTargets} from '@gravity-ui/markdown-viewer';
import {Button, Text, sp} from '@gravity-ui/uikit';

import {cn} from '../cn';

export function Feedback() {
    return (
        <ViewerTargets
            selector="[data-demo-feedback]"
            mode="replace"
            as="div"
            className={cn('feedback', sp({p: 4}))}
        >
            {() => <FeedbackContent />}
        </ViewerTargets>
    );
}

function FeedbackContent() {
    const [helpful, setHelpful] = useState(false);

    return (
        <>
            <Text as="p">
                {helpful ? 'Thanks for your feedback!' : 'Was this section helpful?'}
            </Text>
            <Button onClick={() => setHelpful((value) => !value)}>
                {helpful ? 'Undo feedback' : 'Yes, it was helpful'}
            </Button>
        </>
    );
}
