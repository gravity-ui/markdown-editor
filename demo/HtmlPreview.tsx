import React from 'react';
import transform from '@doc-tools/transform';
import type {ClassNameProps} from '../src/classname';
import {colorClassName, MarkupString} from '../src';
import {plugins} from './md-plugins';

type PlaygroundHtmlPreviewProps = ClassNameProps & {
    value: MarkupString;
    allowHTML?: boolean;
    breaks?: boolean;
    linkify?: boolean;
};

export const PlaygroundHtmlPreview: React.FC<PlaygroundHtmlPreviewProps> =
    function PlaygroundHtmlPreview({value, allowHTML, breaks, linkify, className}) {
        const divRef = React.useRef<HTMLDivElement>(null);

        const html = React.useMemo(() => {
            return transform(value, {
                allowHTML,
                breaks,
                plugins,
                linkify,
                defaultClassName: colorClassName, // markdown-it-color
            }).result.html;
        }, [allowHTML, breaks, linkify, value]);

        return <div ref={divRef} className={className} dangerouslySetInnerHTML={{__html: html}} />;
    };
