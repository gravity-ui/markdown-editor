import {useMemo, useState} from 'react';

import transform from '@diplodoc/transform';
import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';
import {RevealYfmElement} from '@gravity-ui/markdown-viewer/extensions';
import {Button, Flex, SegmentedRadioGroup, Text, sp} from '@gravity-ui/uikit';
import dd from 'ts-dedent';

import {cn} from './cn';

import './MarkdownViewerDemo.scss';
import '@diplodoc/transform/dist/css/yfm.css';

export function RevealYfmElementDemo() {
    const [targetId, setTargetId] = useState<'first' | 'second'>('first');
    const [request, setRequest] = useState(0);
    const [version, setVersion] = useState(1);
    const [revealCount, setRevealCount] = useState(0);
    const html = useMemo(
        () =>
            transform(dd`
                HTML version: ${version}

                {% cut "First section" %}

                {% cut "Nested section" %}

                ### First target {#first}

                {% endcut %}

                {% endcut %}

                {% cut "Second section" %}

                ### Second target {#second}

                {% endcut %}
            `).result.html,
        [version],
    );

    return (
        <Flex className={cn(null, sp({p: 6}))} direction="column" gap="spacing-3">
            <Text>
                Choose a target to reveal it. Close its section and repeat. Updating HTML resets the
                sections without another reveal or scroll.
            </Text>
            <Flex gap="spacing-3" wrap="wrap" alignItems="center">
                <SegmentedRadioGroup
                    aria-label="Reveal target"
                    value={targetId}
                    onUpdate={setTargetId}
                    options={[
                        {value: 'first', content: 'First target'},
                        {value: 'second', content: 'Second target'},
                    ]}
                />
                <Button onClick={() => setRequest((value) => value + 1)}>Reveal again</Button>
                <Button onClick={() => setVersion((value) => value + 1)}>Update HTML</Button>
                <Text>onReveal calls: {revealCount}</Text>
            </Flex>
            <MarkdownViewer html={html} className={cnYFM(null, cn('content', sp({p: 6})))}>
                <RevealYfmElement
                    key={request}
                    id={targetId}
                    onReveal={(element) => {
                        setRevealCount((value) => value + 1);
                        element.scrollIntoView({block: 'nearest'});
                    }}
                />
            </MarkdownViewer>
        </Flex>
    );
}
