import {type DependencyList, createElement, createRef} from 'react';

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

export function shouldAcceptViewerProps() {
    const mods: YFMMods = {'no-list-reset': true};
    return createElement(MarkdownViewer, {
        html: '<p>Text</p>',
        ref: createRef<HTMLDivElement>(),
        className: cnYFM(mods),
        qa: 'document',
    });
}

export function shouldAcceptSynchronousSetup() {
    const effect: ViewerEffect = ({root, signal}: ViewerEffectContext) => {
        const element: HTMLDivElement = root;
        const abort: AbortSignal = signal;
        return () => element.toggleAttribute('data-aborted', abort.aborted);
    };
    useViewerEffect(effect, []);
    return null;
}

export function shouldRejectDangerouslySetInnerHTML() {
    const props: MarkdownViewerProps = {
        html: '',
        // @ts-expect-error Use html for prepared content.
        dangerouslySetInnerHTML: {__html: ''},
    };
    return createElement(MarkdownViewer, props);
}

// @ts-expect-error Async setup cannot return synchronous cleanup.
export const asyncSetup: ViewerEffect = async () => undefined;

expectTypeOf<MarkdownViewerProps['html']>().toEqualTypeOf<string>();
expectTypeOf<ViewerEffectContext['root']>().toEqualTypeOf<HTMLDivElement>();
expectTypeOf<ViewerEffectContext['signal']>().toEqualTypeOf<AbortSignal>();
expectTypeOf<ReturnType<ViewerEffect>>().toEqualTypeOf<void | ViewerEffectCleanup>();
expectTypeOf(useViewerEffect).parameters.toEqualTypeOf<[ViewerEffect, DependencyList]>();
expectTypeOf(cnYFM).parameter(0).toEqualTypeOf<YFMMods | null | undefined>();
