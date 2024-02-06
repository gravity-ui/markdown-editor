import React from 'react';

import {useLatex} from '@diplodoc/latex-extension/react';
import transform from '@diplodoc/transform';

import {MarkupString, colorClassName} from '../src';
import type {ClassNameProps} from '../src/classname';

import {LATEX_RUNTIME, plugins} from './md-plugins';

type PlaygroundHtmlPreviewProps = ClassNameProps & {
    value: MarkupString;
    allowHTML?: boolean;
    breaks?: boolean;
    linkify?: boolean;
    linkifyTlds?: string | string[];
};

type Meta = {script?: string[]; style?: string[]};

export const PlaygroundHtmlPreview: React.FC<PlaygroundHtmlPreviewProps> =
    function PlaygroundHtmlPreview({value, allowHTML, breaks, linkify, linkifyTlds, className}) {
        const divRef = React.useRef<HTMLDivElement>(null);
        const renderLatex = useLatex();

        const result = React.useMemo(() => {
            return transform(value, {
                allowHTML,
                breaks,
                plugins,
                linkify,
                linkifyTlds,
                defaultClassName: colorClassName, // markdown-it-color
            }).result;
        }, [allowHTML, breaks, linkify, linkifyTlds, value]);

        // Load katex only if one or more formulas should be rendered
        if (((result.meta ?? {}) as Meta).script?.includes(LATEX_RUNTIME)) {
            import('@diplodoc/latex-extension/runtime');
        }
        if (((result.meta ?? {}) as Meta).style?.includes(LATEX_RUNTIME)) {
            // @ts-expect-error
            import('@diplodoc/latex-extension/runtime/styles');
        }

        React.useEffect(() => {
            renderLatex({throwOnError: false});
        }, [result.html, renderLatex]);

        return (
            <div
                ref={divRef}
                className={className}
                dangerouslySetInnerHTML={{__html: result.html}}
            />
        );
    };
