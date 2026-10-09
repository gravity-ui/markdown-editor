import {useEffect, useRef, useState} from 'react';

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
        this.content =
            decorations.find((deco) => typeof deco.spec.footnoteContent === 'string')?.spec
                .footnoteContent ?? '';
        this.marker.textContent = marker;
        this.marker.setAttribute('aria-label', i18n('marker', {marker}));
        // Raw HTML is disabled in this MarkdownIt instance.
        this.tooltip.innerHTML = inlineMarkdown.render(this.content);
        this.updateTooltip();
        this.renderItem.rerender();
        return true;
    }

    selectNode() {
        if (this.view.editable) this.openEditor();
    }

    deselectNode() {
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
        this.marker.removeEventListener('click', this.onClick);
        this.renderItem.remove();
    }

    private updateTooltip() {
        this.tooltip.hidden = this.editing || this.dismissed || !(this.hovering || this.focused);
    }

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

    private cancel = () => {
        this.closeEditor();
        const pos = this.getPos();
        if (pos !== undefined && this.view.editable)
            cancelFootnote(pos)(this.view.state, this.view.dispatch);
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
                    onOpenChange={this.cancel}
                >
                    <FootnoteForm
                        label={this.node.attrs.label}
                        content={this.content}
                        onSave={this.save}
                        onCancel={this.cancel}
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
