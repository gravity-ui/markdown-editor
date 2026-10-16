import {useMemo, useState} from 'react';

import transform from '@diplodoc/transform';
import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';
import {Button, Flex, SegmentedRadioGroup, Text, sp} from '@gravity-ui/uikit';

import {cn} from './cn';
import {documents as defaultDocuments} from './content';
import {Feedback} from './extensions/Feedback';
import {PreserveCutState} from './extensions/PreserveCutState';
import {TargetHelp} from './extensions/TargetHelp';

import './MarkdownViewerDemo.scss';
import '@diplodoc/transform/dist/css/yfm.css';

interface MarkdownViewerDemoProps {
    documents?: readonly {label: string; source: string}[];
}

export function MarkdownViewerDemo({documents = defaultDocuments}: MarkdownViewerDemoProps) {
    const [documentIndex, setDocumentIndex] = useState(0);
    const [showFeedback, setShowFeedback] = useState(true);
    const document = documents[documentIndex];
    const result = useMemo(
        () => transform(document.source, {allowHTML: true}).result,
        [document.source],
    );

    return (
        <Flex className={cn(null, sp({p: 6}))} direction="column" gap={3}>
            <Flex
                className={cn('toolbar')}
                alignItems="center"
                justifyContent="space-between"
                gap={4}
            >
                <Text variant="subheader-2">MarkdownViewer</Text>
                <SegmentedRadioGroup
                    aria-label="Document version"
                    value={String(documentIndex)}
                    onUpdate={(value) => setDocumentIndex(Number(value))}
                    options={documents.map(({label}, index) => ({
                        value: String(index),
                        content: label,
                    }))}
                />
            </Flex>
            <Flex
                alignItems="center"
                justifyContent="space-between"
                gap={4}
                className={sp({mt: 1})}
            >
                <Text as="p" variant="body-2" color="secondary">
                    Open sections and heading help marks, then switch versions. Sections keep their
                    open or closed state even when their title or position changes. Help marks show
                    heading IDs and preserve opening counts by ID across versions. Hide feedback to
                    see the fallback text.
                </Text>
                <Button
                    className={cn('feedback-toggle')}
                    onClick={() => setShowFeedback((value) => !value)}
                >
                    {showFeedback ? 'Hide feedback' : 'Show feedback'}
                </Button>
            </Flex>
            <MarkdownViewer
                html={result.html}
                className={cnYFM(
                    {'no-list-reset': true, 'no-stripe-table': true},
                    cn('content', sp({p: 6})),
                )}
                qa="demo-markdown-viewer"
                role="region"
                aria-label="MarkdownViewer playground"
            >
                <PreserveCutState />
                <TargetHelp />
                {showFeedback && <Feedback />}
            </MarkdownViewer>
        </Flex>
    );
}
