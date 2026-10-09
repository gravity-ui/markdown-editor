import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it} from 'vitest';

import {ExtensionsManager} from '../../../core';
import {CommonMarkSpecsPreset} from '../../../presets/commonmark-specs';
import {ReactRenderStorage, ReactRendererExtension} from '../../behavior/ReactRenderer';

import {footnoteType} from './FootnoteSpecs';

import {Footnote} from '.';

let view: EditorView | undefined;
afterEach(() => {
    view?.destroy();
    view = undefined;
    document.body.replaceChildren();
});

function mount(markup: string, editable = true) {
    const storage = new ReactRenderStorage();
    const config = new ExtensionsManager({
        extensions: (builder) =>
            builder
                .use(CommonMarkSpecsPreset, {})
                .use(ReactRendererExtension, storage)
                .use(Footnote),
    }).build();
    const host = document.createElement('div');
    document.body.append(host);
    view = new EditorView(host, {
        state: EditorState.create({
            doc: config.markupParser.parse(markup),
            plugins: config.plugins,
        }),
        nodeViews: config.nodeViews,
        editable: () => editable,
    });
    return {view, storage};
}

describe('Footnote view', () => {
    it('should expose a keyboard marker and an accessible formatted description', () => {
        mount('Text:footnote[**Bold** and [link](https://example.com)].');
        const marker = document.querySelector<HTMLButtonElement>('.g-md-footnote__marker')!;
        const tooltip = document.querySelector<HTMLElement>('[role="tooltip"]')!;
        expect(marker.tagName).toBe('BUTTON');
        expect(marker.getAttribute('aria-describedby')).toBe(tooltip.id);
        expect(tooltip.hidden).toBe(true);
        marker.focus();
        expect(tooltip.hidden).toBe(false);
        expect(tooltip.querySelector('strong')?.textContent).toBe('Bold');
        expect(tooltip.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
        marker.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
        expect(tooltip.hidden).toBe(true);
    });

    it('should dismiss a hovered tooltip with Escape outside the marker', () => {
        mount(':footnote[Text]');
        const note = document.querySelector<HTMLElement>('.g-md-footnote')!;
        const tooltip = note.querySelector<HTMLElement>('[role="tooltip"]')!;
        note.dispatchEvent(new MouseEvent('mouseenter'));
        expect(tooltip.hidden).toBe(false);
        document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
        expect(tooltip.hidden).toBe(true);
        note.dispatchEvent(new MouseEvent('mouseleave'));
        note.dispatchEvent(new MouseEvent('mouseenter'));
        expect(tooltip.hidden).toBe(false);
    });

    it('should update the marker numbers and remove rendered items on destroy', () => {
        const {view: editor, storage} = mount(':footnote[First]:footnote[Second]');
        expect(
            [...document.querySelectorAll('.g-md-footnote__marker')].map(
                (element) => element.textContent,
            ),
        ).toEqual(['1', '2']);
        editor.dispatch(
            editor.state.tr.insert(1, footnoteType(editor.state.schema).create({content: 'New'})),
        );
        expect(
            [...document.querySelectorAll('.g-md-footnote__marker')].map(
                (element) => element.textContent,
            ),
        ).toEqual(['1', '2', '3']);
        expect(storage.getItems()).toHaveLength(3);
        editor.destroy();
        view = undefined;
        expect(storage.getItems()).toHaveLength(0);
    });

    it('should allow reading footnotes without opening an editor in read-only mode', () => {
        const {storage} = mount(':footnote[Text]', false);
        const marker = document.querySelector<HTMLButtonElement>('.g-md-footnote__marker')!;
        marker.focus();
        marker.click();
        expect(document.querySelector<HTMLElement>('[role="tooltip"]')?.hidden).toBe(false);
        expect(storage.getItems()[0].render()).toBeNull();
    });
});
