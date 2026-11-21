import {
    ErrorLoggerBoundary,
    type RendererItem,
    getReactRendererFromState,
} from '@gravity-ui/markdown-editor';
import type {ExtensionDeps} from '@gravity-ui/markdown-editor/core';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    type EditorState,
    NodeSelection,
    Plugin,
    type PluginView,
} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {buttonClassName, normalizeButtonHref} from '@gravity-ui/markdown-plugin-banner';

import {runCommand} from '../../../commands';
import {ButtonAttr, buttonPlaceholder, isButton} from '../../ButtonSpecs';
import {type ButtonAttrs, selectedButton, setButtonAttrs} from '../../commands';

import {ButtonSettings} from './ButtonSettings';
import {buttonSettingsKey, openButtonSettings} from './const';

type MarkupParser = ExtensionDeps['markupParser'];
type Shown = {node: Node; pos: number; anchor: HTMLElement};

export const buttonSettingsOpen = (state: EditorState) =>
    Boolean(buttonSettingsKey.getState(state));

const selectedPos = (state: EditorState) => selectedButton(state)?.pos ?? null;

class ButtonSettingsView implements PluginView {
    private view: EditorView;
    private readonly markupParser: MarkupParser;
    private readonly renderItem: RendererItem;
    private shown: Shown | null = null;

    constructor(view: EditorView, markupParser: MarkupParser) {
        this.view = view;
        this.markupParser = markupParser;
        this.renderItem = getReactRendererFromState(view.state).createItem(
            'button-settings',
            this.render,
        );
        this.update(view);
    }

    update(view: EditorView) {
        this.view = view;
        const prev = this.shown;
        const selected = buttonSettingsOpen(view.state) ? selectedButton(view.state) : null;
        const anchor = selected ? view.nodeDOM(selected.pos) : null;
        this.shown = selected && anchor instanceof HTMLElement ? {...selected, anchor} : null;
        const {shown} = this;
        if (
            prev?.pos !== shown?.pos ||
            prev?.node !== shown?.node ||
            prev?.anchor !== shown?.anchor
        )
            this.renderItem.rerender();
    }

    destroy() {
        this.renderItem.remove();
    }

    private render = () => {
        const {shown} = this;
        if (!shown) return null;
        const {node, anchor} = shown;
        return (
            <ErrorLoggerBoundary>
                <ButtonSettings
                    anchor={anchor}
                    label={node.attrs[ButtonAttr.Label]}
                    placeholder={buttonPlaceholder(node)}
                    attrs={node.attrs as ButtonAttrs}
                    onChange={this.change}
                    onHrefChange={this.changeHref}
                    onLabelChange={this.changeLabel}
                    onClose={this.close}
                />
            </ErrorLoggerBoundary>
        );
    };

    private change = (attrs: Partial<ButtonAttrs>) =>
        Boolean(this.shown && runCommand(this.view, setButtonAttrs(this.shown.pos, attrs)));

    private changeHref = (value: string) => {
        const href = normalizeButtonHref(this.markupParser, value);
        return (!value || Boolean(href)) && this.change({href});
    };

    private changeLabel = (label: string) => this.change({[ButtonAttr.Label]: label});

    private close = (reason?: string) => {
        const {view} = this;
        if (buttonSettingsOpen(view.state)) view.dispatch(openButtonSettings(view.state.tr, false));
        if (reason !== 'outside-press' && reason !== 'focus-out') view.focus();
    };
}

function clickedButton(view: EditorView, event: MouseEvent) {
    if (event.button !== 0 || !(event.target instanceof Element)) return null;
    const anchor = event.target.closest(`a.${buttonClassName}`);
    if (!anchor || !view.dom.contains(anchor)) return null;
    const pos = view.posAtDOM(anchor, 0);
    return isButton(view.state.doc.nodeAt(pos)) ? pos : null;
}

export const buttonSettingsPlugin = ({markupParser}: Pick<ExtensionDeps, 'markupParser'>) =>
    new Plugin<boolean>({
        key: buttonSettingsKey,
        state: {
            init: () => false,
            apply(tr, open, oldState, state) {
                const pos = selectedPos(state);
                if (pos === null) return false;
                const meta = tr.getMeta(buttonSettingsKey);
                if (typeof meta === 'boolean') return meta;
                const before = selectedPos(oldState);
                return open && before !== null && tr.mapping.map(before) === pos;
            },
        },
        props: {
            handleDOMEvents: {
                beforeinput(view, event) {
                    if (!buttonSettingsOpen(view.state)) return false;
                    event.preventDefault();
                    return true;
                },
                mousedown(view, event) {
                    const pos = clickedButton(view, event);
                    if (pos === null) return false;
                    event.preventDefault();
                    const {tr, doc} = view.state;
                    view.dispatch(
                        openButtonSettings(tr.setSelection(NodeSelection.create(doc, pos))),
                    );
                    return true;
                },
            },
            handleKeyDown(view, event) {
                const open = buttonSettingsOpen(view.state);
                const plain = !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
                if (open && !(plain && event.key === 'Escape')) return true;
                if (!plain || selectedPos(view.state) === null) return false;
                if (event.key !== (open ? 'Escape' : 'Enter')) return false;
                view.dispatch(openButtonSettings(view.state.tr, !open));
                return true;
            },
            handleTextInput: (view) => buttonSettingsOpen(view.state),
        },
        view: (view) => new ButtonSettingsView(view, markupParser),
    });
