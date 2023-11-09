import React from 'react';
import transform from '@diplodoc/transform';
import type {ClassNameProps} from '../src/classname';
import {colorClassName, MarkupString} from '../src';
import {plugins} from './md-plugins';

type PlaygroundHtmlPreviewProps = ClassNameProps & {
    value: MarkupString;
    allowHTML?: boolean;
    breaks?: boolean;
    linkify?: boolean;
    linkifyTlds?: string | string[];
};

export const PlaygroundHtmlPreview: React.FC<PlaygroundHtmlPreviewProps> =
    function PlaygroundHtmlPreview({value, allowHTML, breaks, linkify, linkifyTlds, className}) {
        const divRef = React.useRef<HTMLDivElement>(null);

        const html = React.useMemo(() => {
            return transform(value, {
                allowHTML,
                breaks,
                plugins,
                linkify,
                linkifyTlds,
                defaultClassName: colorClassName, // markdown-it-color
            }).result.html;
        }, [allowHTML, breaks, linkify, linkifyTlds, value]);

        return <div ref={divRef} className={className} dangerouslySetInnerHTML={{__html: html}} />;
    };
