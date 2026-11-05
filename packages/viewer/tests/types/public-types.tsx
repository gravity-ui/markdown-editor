import {type DependencyList, createRef} from 'react';

import {expectTypeOf} from 'vitest';

import {
    MarkdownViewer,
    type MarkdownViewerProps,
    type ViewerEffect,
    type ViewerEffectCleanup,
    type ViewerEffectContext,
    type YFMMods,
    cnYFM,
    useViewerEffect,
} from '../../src';

export function Consumer() {
    const mods: YFMMods = {'no-list-reset': true};
    return (
        <MarkdownViewer
            html="<p>Text</p>"
            ref={createRef<HTMLDivElement>()}
            className={cnYFM(mods)}
            qa="document"
        />
    );
}

export function Extension() {
    const effect: ViewerEffect = ({root, signal}: ViewerEffectContext) => {
        const element: HTMLDivElement = root;
        const abort: AbortSignal = signal;
        return () => element.toggleAttribute('data-aborted', abort.aborted);
    };
    useViewerEffect(effect, []);
    return null;
}

// @ts-expect-error Use html for prepared content.
export const raw = <MarkdownViewer html="" dangerouslySetInnerHTML={{__html: ''}} />;
// @ts-expect-error Async setup cannot return synchronous cleanup.
export const asyncSetup: ViewerEffect = async () => undefined;

expectTypeOf<MarkdownViewerProps['html']>().toEqualTypeOf<string>();
expectTypeOf<ViewerEffectContext['root']>().toEqualTypeOf<HTMLDivElement>();
expectTypeOf<ViewerEffectContext['signal']>().toEqualTypeOf<AbortSignal>();
expectTypeOf<ReturnType<ViewerEffect>>().toEqualTypeOf<void | ViewerEffectCleanup>();
expectTypeOf(useViewerEffect).parameters.toEqualTypeOf<[ViewerEffect, DependencyList]>();
expectTypeOf(cnYFM).parameter(0).toEqualTypeOf<YFMMods | null | undefined>();
