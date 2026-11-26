import {type DependencyList, createElement, createRef} from 'react';

import {expectTypeOf} from 'vitest';

import {
    MarkdownViewer,
    type MarkdownViewerProps,
    type NAMESPACE,
    VIEWER_ROOT_ATTRIBUTE,
    VIEWER_SLOT_ATTRIBUTE,
    type ViewerEffect,
    type ViewerEffectCleanup,
    type ViewerEffectContext,
    ViewerTargets,
    type ViewerTargetsProps,
    type YFMMods,
    cn,
    cnYFM,
    useViewerEffect,
} from '../../src';

export function shouldExportViewerAttributeNames() {
    const root: 'data-markdown-viewer-root' = VIEWER_ROOT_ATTRIBUTE;
    const slot: 'data-markdown-viewer-slot' = VIEWER_SLOT_ATTRIBUTE;
    return {root, slot};
}

export function shouldAcceptViewerProps() {
    const mods: YFMMods = {'no-list-reset': true, custom: 'value', level: 2};
    return createElement(MarkdownViewer, {
        html: '<p>Text</p>',
        ref: createRef<HTMLDivElement>(),
        className: cnYFM(mods),
        qa: 'document',
        children: createElement(ViewerTargets, {
            selector: 'h2[id]',
            slotKey: 'copy',
            as: 'span',
            className: 'actions',
            style: {display: 'flex'},
            children: (target) => createElement('button', null, target.id),
        }),
    });
}

export function shouldAcceptCustomYfmMods() {
    interface CustomMods {
        gallery?: boolean;
    }
    const mods: YFMMods<CustomMods> = {'no-list-reset': true, gallery: true};
    const customCn = cnYFM<CustomMods>;
    const result: string = customCn(mods, 'extra');
    // @ts-expect-error Custom modifier names are checked.
    customCn({galery: true});
    // @ts-expect-error Custom modifier values are checked.
    customCn({gallery: 'yes'});
    // @ts-expect-error Built-in modifiers keep their boolean types.
    customCn({'no-list-reset': 'yes'});
    return result;
}

export function shouldRejectInvalidYfmMods() {
    // @ts-expect-error Built-in modifiers stay boolean in open calls.
    cnYFM({'no-list-reset': 'yes'});
    // @ts-expect-error Open modifiers do not accept objects.
    cnYFM({custom: {enabled: true}});
    // @ts-expect-error Custom modifier types must use BEM modifier values.
    cnYFM<{custom?: {enabled: boolean}}>();
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

export function shouldAcceptSynchronousElementClaims({root, claim}: ViewerEffectContext) {
    const release: () => void = claim(root, 'hide', () => {
        root.setAttribute('hidden', '');
        return () => root.removeAttribute('hidden');
    });
    return release;
}

export function shouldRejectInvalidClaims({root, claim}: ViewerEffectContext) {
    // @ts-expect-error Claim keys are strings.
    claim(root, Symbol(), () => undefined);
    // @ts-expect-error Claim setup must finish before the next claim starts.
    claim(root, 'hide', async () => undefined);
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

export const invalidSlot = createElement(ViewerTargets, {
    selector: 'h2',
    // @ts-expect-error Only span and div slots are supported.
    as: 'button',
    children: () => null,
});

export function shouldRejectInvalidSlotKey(props: ViewerTargetsProps) {
    // @ts-expect-error Named slots use string keys.
    return createElement(ViewerTargets, {...props, slotKey: 1});
}

expectTypeOf<MarkdownViewerProps['html']>().toEqualTypeOf<string>();
expectTypeOf<ViewerEffectContext['root']>().toEqualTypeOf<HTMLDivElement>();
expectTypeOf<ViewerEffectContext['signal']>().toEqualTypeOf<AbortSignal>();
expectTypeOf<ReturnType<ViewerEffect>>().toEqualTypeOf<void | ViewerEffectCleanup>();
expectTypeOf(useViewerEffect).parameters.toEqualTypeOf<[ViewerEffect, DependencyList]>();
expectTypeOf(cn('diagram')('caption')).toEqualTypeOf<string>();
expectTypeOf<typeof NAMESPACE>().toEqualTypeOf<'g-md-v-'>();
expectTypeOf(cnYFM).parameter(0).toEqualTypeOf<YFMMods | null | undefined>();
expectTypeOf<ViewerTargetsProps['children']>().parameter(0).toEqualTypeOf<HTMLElement>();
expectTypeOf<ViewerTargetsProps['className']>().toEqualTypeOf<string | undefined>();
