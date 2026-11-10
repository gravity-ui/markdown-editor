import {forwardRef, useImperativeHandle, useRef} from 'react';

import {type MarkdownViewerProps, ViewerContent} from './ViewerContent';

export type {MarkdownViewerProps} from './ViewerContent';

export const MarkdownViewer = forwardRef<HTMLDivElement, MarkdownViewerProps>(
    function MarkdownViewer(props, ref) {
        const contentRef = useRef<HTMLDivElement>(null);
        useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
            ref,
            () => contentRef.current,
            [],
        );

        return <ViewerContent {...props} contentRef={contentRef} />;
    },
);
