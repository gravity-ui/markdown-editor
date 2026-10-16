import {useMemo, useState} from 'react';

import transform from '@diplodoc/transform';
import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';
import {Flex, SegmentedRadioGroup, Text, sp} from '@gravity-ui/uikit';

import {block} from '../../utils/cn';

import {documents as defaultDocuments} from './content';
import {PreserveCutState} from './extensions/PreserveCutState';

import './MarkdownViewerDemo.scss';
import '@diplodoc/transform/dist/css/yfm.css';

const b = block('markdown-viewer-demo');

interface MarkdownViewerDemoProps {
    documents?: readonly {label: string; source: string}[];
}

export function MarkdownViewerDemo({documents = defaultDocuments}: MarkdownViewerDemoProps) {
    const [documentIndex, setDocumentIndex] = useState(0);
    const document = documents[documentIndex];
    const result = useMemo(() => transform(document.source).result, [document.source]);

    return (
        <Flex className={b(null, sp({p: 6}))} direction="column" gap={3}>
            <Flex
                className={b('toolbar')}
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
            <Text as="p" variant="body-2" color="secondary" className={sp({mt: 1})}>
                Open a few sections and switch versions. Sections remember whether you left them
                open or closed, even if their title or position changes.
            </Text>
            <MarkdownViewer
                html={result.html}
                className={cnYFM(
                    {'no-list-reset': true, 'no-stripe-table': true},
                    b('content', sp({p: 6})),
                )}
                qa="demo-markdown-viewer"
                role="region"
                aria-label="MarkdownViewer playground"
            >
                <PreserveCutState />
            </MarkdownViewer>
        </Flex>
    );
}
