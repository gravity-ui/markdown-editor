import {useEffect, useRef, useState} from 'react';

import term from '@diplodoc/transform/lib/plugins/term';
import {Button, Portal, TextArea, TextInput} from '@gravity-ui/uikit';
import MarkdownIt from 'markdown-it';
import type {Node} from 'prosemirror-model';
import type {Decoration, EditorView, NodeView} from 'prosemirror-view';

import type {ExtensionDeps} from '#core';
import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {i18n as common} from 'src/i18n/common';
import {i18n} from 'src/i18n/footnote';
import {EditorPopup} from 'src/plugins/BaseTooltip/EditorPopup';
import {generateEntityId} from 'src/utils/entity-id';

import {cancelFootnote, updateFootnote} from './commands';

const inlineMarkdown = new MarkdownIt({html: false, breaks: true});
// The native term rule keeps `(*key)` from becoming a link and resolves nested references.
inlineMarkdown.use(term, {isLintRun: false} as Parameters<typeof term>[1]);
inlineMarkdown.renderer.rules.term_open = () => '<span class="g-md-footnote__term">';
inlineMarkdown.renderer.rules.term_close = () => '</span>';

export class FootnoteView implements NodeView {
    readonly dom = document.createElement('span');
    private readonly marker = document.createElement('button');
    private readonly tooltip = document.createElement('span');
    private readonly renderItem;
    private node;
    private content = '';
    private editing = false;
    private hovering = false;
    private focused = false;
    private dismissed = false;
    private selected = false;
    private readonly view: EditorView;
    private readonly getPos: () => number | undefined;
    private readonly deps: ExtensionDeps;

    constructor(
        node: Node,
        view: EditorView,
        getPos: () => number | undefined,
        deps: ExtensionDeps,
        decorations: readonly Decoration[],
    ) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;
        this.deps = deps;
        this.dom.className = 'g-md-footnote';
        this.dom.contentEditable = 'false';
        this.marker.type = 'button';
        this.marker.className = 'g-md-footnote__marker';
        this.tooltip.className = 'g-md-footnote__content';
        this.tooltip.id = generateEntityId('footnote-tooltip');
        this.tooltip.setAttribute('role', 'tooltip');
        this.marker.setAttribute('aria-describedby', this.tooltip.id);
        this.dom.append(this.marker, this.tooltip);
        this.dom.addEventListener('mouseenter', this.onMouseEnter);
        this.dom.addEventListener('mouseleave', this.onMouseLeave);
        this.dom.addEventListener('focusin', this.onFocus);
        this.dom.addEventListener('focusout', this.onBlur);
        this.dom.ownerDocument.addEventListener('keydown', this.onKeyDown, true);
        this.dom.ownerDocument.addEventListener('scroll', this.placeTooltip, true);
        this.marker.addEventListener('click', this.onClick);
        this.renderItem = getReactRendererFromState(view.state).createItem('footnote-edit', () =>
            this.renderEditor(),
        );
        this.update(node, decorations);
    }

    update(node: Node, decorations: readonly Decoration[]) {
        if (node.type !== this.node.type) return false;
        this.node = node;
        const marker = node.attrs.label;
        const spec = decorations.find((deco) => 'footnoteContent' in deco.spec)?.spec;
        const resolved = typeof spec?.footnoteContent === 'string';
        this.content = resolved ? spec.footnoteContent : '';
        this.marker.textContent = marker;
        this.marker.setAttribute('aria-label', i18n('marker', {marker}));
        this.dom.classList.toggle('g-md-footnote_unresolved', !resolved);
        if (resolved) {
            // Raw HTML is disabled in this MarkdownIt instance.
            this.tooltip.innerHTML = inlineMarkdown
                .render(this.content, {terms: {...spec.footnoteTerms}})
                .trim();
        } else {
            this.tooltip.textContent = i18n('missing');
        }
        this.updateTooltip();
        this.renderItem.rerender();
        return true;
    }

    selectNode() {
        this.selected = true;
        this.dismissed = false;
        this.dom.classList.add('g-md-footnote_selected');
        // A new footnote opens its form; keyboard navigation only shows the explanation.
        if (this.view.editable && this.node.attrs.original !== null) this.openEditor();
        else this.updateTooltip();
    }

    deselectNode() {
        this.selected = false;
        this.dom.classList.remove('g-md-footnote_selected');
        this.closeEditor();
    }

    stopEvent() {
        return true;
    }

    ignoreMutation() {
        return true;
    }

    destroy() {
        this.dom.removeEventListener('mouseenter', this.onMouseEnter);
        this.dom.removeEventListener('mouseleave', this.onMouseLeave);
        this.dom.removeEventListener('focusin', this.onFocus);
        this.dom.removeEventListener('focusout', this.onBlur);
        this.dom.ownerDocument.removeEventListener('keydown', this.onKeyDown, true);
        this.dom.ownerDocument.removeEventListener('scroll', this.placeTooltip, true);
        this.marker.removeEventListener('click', this.onClick);
        this.renderItem.remove();
    }

    private updateTooltip() {
        this.tooltip.hidden =
            this.editing || this.dismissed || !(this.hovering || this.focused || this.selected);
        this.placeTooltip();
    }

    // Fixed position keeps the tooltip outside the clipping of the editor scroll container.
    private placeTooltip = () => {
        if (this.tooltip.hidden) return;
        const gap = 4;
        const anchor = this.marker.getBoundingClientRect();
        const {innerWidth, innerHeight} = this.dom.ownerDocument.defaultView ?? window;
        const {offsetWidth: width, offsetHeight: height} = this.tooltip;
        const below = anchor.bottom + gap;
        const above = anchor.top - gap - height;
        const top = below + height > innerHeight && above >= 0 ? above : below;
        const left = Math.max(0, Math.min(anchor.left, innerWidth - width));
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
    };

    private onMouseEnter = () => {
        this.hovering = true;
        this.dismissed = false;
        this.updateTooltip();
    };

    private onMouseLeave = () => {
        this.hovering = false;
        this.updateTooltip();
    };

    private onFocus = () => {
        this.focused = true;
        this.dismissed = false;
        this.updateTooltip();
    };

    private onBlur = (event: FocusEvent) => {
        if (
            event.relatedTarget instanceof globalThis.Node &&
            this.dom.contains(event.relatedTarget)
        )
            return;
        this.focused = false;
        this.updateTooltip();
    };

    private onKeyDown = (event: KeyboardEvent) => {
        if (
            event.key === 'Enter' &&
            this.selected &&
            !this.editing &&
            this.view.editable &&
            this.view.hasFocus()
        ) {
            event.preventDefault();
            event.stopPropagation();
            this.openEditor();
            return;
        }
        if (event.key !== 'Escape' || this.editing || this.tooltip.hidden) return;
        event.preventDefault();
        event.stopPropagation();
        this.dismissed = true;
        this.updateTooltip();
    };

    private onClick = () => {
        if (this.view.editable) this.openEditor();
    };

    private openEditor() {
        this.editing = true;
        this.updateTooltip();
        this.renderItem.rerender();
    }

    private closeEditor = () => {
        this.editing = false;
        this.dismissed = true;
        this.updateTooltip();
        this.renderItem.rerender();
    };

    private cancel = (returnFocus: boolean) => {
        this.closeEditor();
        const pos = this.getPos();
        if (pos !== undefined && this.view.editable)
            cancelFootnote(pos)(this.view.state, this.view.dispatch);
        if (returnFocus) this.view.focus();
    };

    private save = (label: string, content: string) => {
        const pos = this.getPos();
        if (pos === undefined || !this.view.editable) return false;
        const result = updateFootnote(
            pos,
            label,
            content,
            this.deps,
        )(this.view.state, this.view.dispatch);
        if (result) {
            this.closeEditor();
            this.view.focus();
        }
        return result;
    };

    private renderEditor() {
        return this.editing ? (
            <Portal>
                <EditorPopup
                    editorElement={this.view.dom}
                    anchorElement={this.marker}
                    onOpenChange={(_open, _event, reason) =>
                        this.cancel(reason !== 'outside-press')
                    }
                >
                    <FootnoteForm
                        label={this.node.attrs.label}
                        content={this.content}
                        onSave={this.save}
                        onCancel={() => this.cancel(true)}
                    />
                </EditorPopup>
            </Portal>
        ) : null;
    }
}

function FootnoteForm({
    label,
    content,
    onSave,
    onCancel,
}: {
    label: string;
    content: string;
    onSave: (label: string, content: string) => boolean;
    onCancel: () => void;
}) {
    const [value, setValue] = useState(content);
    const [labelValue, setLabelValue] = useState(label);
    const [invalid, setInvalid] = useState(false);
    const contentRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        // The popup is initially mounted before its position is calculated.
        contentRef.current?.focus({preventScroll: true});
    }, []);
    return (
        <form
            className="g-md-footnote-editor"
            aria-label={i18n('title')}
            onSubmit={(event) => {
                event.preventDefault();
                setInvalid(!onSave(labelValue, value));
            }}
        >
            <TextInput
                value={labelValue}
                onUpdate={setLabelValue}
                controlProps={{'aria-label': i18n('label')}}
            />
            <TextArea
                controlRef={contentRef}
                value={value}
                onUpdate={setValue}
                rows={3}
                controlProps={{'aria-label': i18n('content')}}
                error={invalid ? i18n('invalid') : undefined}
            />
            <div className="g-md-footnote-editor__actions">
                <Button type="submit" view="action">
                    {common('save')}
                </Button>
                <Button onClick={onCancel}>{common('cancel')}</Button>
            </div>
        </form>
    );
}
