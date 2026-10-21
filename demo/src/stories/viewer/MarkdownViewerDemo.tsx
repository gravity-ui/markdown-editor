import {useMemo, useState} from 'react';

import {transform as latex} from '@diplodoc/latex-extension';
import {transform as pageConstructor} from '@diplodoc/page-constructor-extension/plugin/csr';
import transform from '@diplodoc/transform';
import defaultPlugins from '@diplodoc/transform/lib/plugins';
import {type GalleryItemProps, GalleryProvider} from '@gravity-ui/components';
import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';
import {
    FilesGallery,
    type FilesGallerySource,
    YfmCodeBlockActions,
} from '@gravity-ui/markdown-viewer/extensions';
import {Button, Flex, SegmentedRadioGroup, Text, sp} from '@gravity-ui/uikit';

import {cn} from './cn';
import {documents as defaultDocuments, galleryCustomFile} from './content';
import {DiplodocLatex} from './extensions/DiplodocLatex';
import {DiplodocPageConstructor} from './extensions/DiplodocPageConstructor';
import {Feedback} from './extensions/Feedback';
import {PreserveCutState} from './extensions/PreserveCutState';
import {TargetHelp} from './extensions/TargetHelp';

import './MarkdownViewerDemo.scss';
import '@diplodoc/transform/dist/css/yfm.css';

const plugins = [
    ...defaultPlugins,
    latex({bundle: false, validate: false}),
    pageConstructor({bundle: false}),
];

interface MarkdownViewerDemoProps {
    documents?: readonly {label: string; source: string}[];
    showFeedbackToggle?: boolean;
}

export function MarkdownViewerDemo({
    documents = defaultDocuments,
    showFeedbackToggle = true,
}: MarkdownViewerDemoProps) {
    const [documentIndex, setDocumentIndex] = useState(0);
    const [showFeedback, setShowFeedback] = useState(true);
    const document = documents[documentIndex];
    const result = useMemo(
        () => transform(document.source, {allowHTML: true, codeLineWrapping: true, plugins}).result,
        [document.source],
    );

    return (
        <GalleryProvider>
            <Flex className={cn(null, sp({p: 6}))} direction="column" gap={3}>
                <Flex
                    className={cn('toolbar')}
                    alignItems="center"
                    justifyContent="space-between"
                    gap={4}
                >
                    <Text variant="subheader-2">MarkdownViewer</Text>
                    {documents.length > 1 && (
                        <SegmentedRadioGroup
                            aria-label="Document version"
                            value={String(documentIndex)}
                            onUpdate={(value) => setDocumentIndex(Number(value))}
                            options={documents.map(({label}, index) => ({
                                value: String(index),
                                content: label,
                            }))}
                        />
                    )}
                    {showFeedbackToggle && (
                        <Button
                            className={cn('feedback-toggle')}
                            onClick={() => setShowFeedback((value) => !value)}
                        >
                            {showFeedback ? 'Hide feedback' : 'Show feedback'}
                        </Button>
                    )}
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
                    <YfmCodeBlockActions />
                    <DiplodocLatex meta={result.meta} />
                    <DiplodocPageConstructor meta={result.meta} />
                    <FilesGallery
                        getCopyUrl={getGalleryUrl}
                        getDownloadUrl={getGalleryUrl}
                        resolveCustomItem={resolveCustomFile}
                    />
                    {showFeedback && <Feedback />}
                </MarkdownViewer>
            </Flex>
        </GalleryProvider>
    );
}

function getGalleryUrl({url}: FilesGallerySource) {
    return url;
}

function resolveCustomFile({
    name,
    mimeType,
}: FilesGallerySource & {type: 'file'}): GalleryItemProps | undefined {
    if (mimeType !== galleryCustomFile.mimetype) return undefined;

    return {
        name,
        view: <Text className={sp({p: 6})}>{galleryCustomFile.preview}</Text>,
        thumbnail: <Text>MD</Text>,
    };
}
