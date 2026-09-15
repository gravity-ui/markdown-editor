import {useEffect, useRef, useState} from 'react';
import type {FC} from 'react';

import {HTML_CONSTRUCTOR_VARIABLES_CSS} from '../cssVariables';

import {cnYfmHtmlConstructor} from './const';

const b = cnYfmHtmlConstructor;

/** Design width the template markup is authored against before being scaled down. */
export const PREVIEW_DESIGN_WIDTH = 1040;

/**
 * Renders arbitrary template markup + CSS inside a shadow root and scales it down
 * to fit the available width, so card and theme previews stay isolated and crisp.
 */
export const LivePreview: FC<{markup: string; css: string}> = ({markup, css}) => {
    const frameRef = useRef<HTMLDivElement>(null);
    const hostRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.3);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        const root = host.shadowRoot ?? host.attachShadow({mode: 'open'});
        root.innerHTML = `<style>:host{display:block}*{box-sizing:border-box}img{max-width:100%}${HTML_CONSTRUCTOR_VARIABLES_CSS}${css}</style>${markup}`;
    }, [css, markup]);

    useEffect(() => {
        const frame = frameRef.current;
        if (!frame || typeof ResizeObserver === 'undefined') return undefined;

        const update = () => setScale(frame.clientWidth / PREVIEW_DESIGN_WIDTH);
        update();

        const observer = new ResizeObserver(update);
        observer.observe(frame);

        return () => observer.disconnect();
    }, []);

    return (
        <span ref={frameRef} className={b('structure-preview')} aria-hidden="true">
            <span
                className={b('structure-preview-scale')}
                style={{width: PREVIEW_DESIGN_WIDTH, transform: `scale(${scale})`}}
            >
                <span ref={hostRef} />
            </span>
        </span>
    );
};
