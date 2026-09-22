import {useMemo, useState} from 'react';

import {Gear, LayoutHeaderColumns, Plus, TrashBin} from '@gravity-ui/icons';
import {Button, Icon, Menu, Popup} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {cn} from 'src/classname';
import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {useElementState} from 'src/react-utils/hooks';
import {removeNode} from 'src/utils/remove-node';

import {GridBlockConsts} from '../GridBlockSpecs/const';
import type {GridBlock} from '../types';

import {GRID_TEMPLATES, type GridTemplate} from './templates';

import './GridBlock.scss';

export const STOP_EVENT_CLASSNAME = 'prosemirror-stop-event';

const b = cn('grid-block');
const stop = STOP_EVENT_CLASSNAME;

// PROTOTYPE: raw inline declarations, no scoping or sanitization.
const parseInlineCss = (css: string): React.CSSProperties => {
    const style: Record<string, string> = {};
    for (const rule of css.split(';')) {
        const idx = rule.indexOf(':');
        if (idx === -1) continue;
        const prop = rule.slice(0, idx).trim();
        const value = rule.slice(idx + 1).trim();
        if (!prop || !value) continue;
        const camel = prop.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
        style[camel] = value;
    }
    return style as React.CSSProperties;
};

const genId = () => Math.random().toString(36).slice(2, 10);

const newBlock = (): GridBlock => ({id: genId(), css: '', text: ''});

const CssPopup: React.FC<{
    anchor: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}> = ({anchor, open, onClose, value, onChange, placeholder}) => (
    <Popup anchorElement={anchor} open={open} onOpenChange={onClose} placement="bottom-end">
        <div className={b('css-editor', [stop])}>
            <TextArea
                controlProps={{className: stop}}
                value={value}
                onUpdate={onChange}
                placeholder={placeholder}
                minRows={4}
                autoFocus
            />
        </div>
    </Popup>
);

export const GridBlockView: React.FC<{
    node: Node;
    getPos: () => number | undefined;
    view: EditorView;
    onChange: (attrs: Partial<Node['attrs']>) => void;
}> = ({node, getPos, view, onChange}) => {
    const entityId: string = node.attrs[GridBlockConsts.NodeAttrs.EntityId];
    const containerCss: string = node.attrs[GridBlockConsts.NodeAttrs.containerCss] ?? '';
    const blocks: GridBlock[] = node.attrs[GridBlockConsts.NodeAttrs.blocks] ?? [];

    const scopeClass = useMemo(
        () => 'grid-scope-' + entityId.replace(/[^a-z0-9_-]/gi, ''),
        [entityId],
    );

    const [containerAnchor, setContainerAnchor] = useElementState();
    const [containerCssOpen, setContainerCssOpen] = useState(false);

    const [blockAnchor, setBlockAnchor] = useElementState();
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

    const [templatesAnchor, setTemplatesAnchor] = useElementState();
    const [templatesOpen, setTemplatesOpen] = useState(false);

    const setBlocks = (next: GridBlock[]) => onChange({[GridBlockConsts.NodeAttrs.blocks]: next});

    const applyTemplate = (template: GridTemplate) => {
        onChange({
            [GridBlockConsts.NodeAttrs.containerCss]: template.containerCss,
            [GridBlockConsts.NodeAttrs.blocks]: template.blocks.map((block) => ({
                id: genId(),
                css: block.css,
                text: block.text,
            })),
        });
        setTemplatesOpen(false);
    };

    const addBlock = () => setBlocks([...blocks, newBlock()]);

    const patchBlock = (id: string, patch: Partial<GridBlock>) =>
        setBlocks(blocks.map((block) => (block.id === id ? {...block, ...patch} : block)));

    const editingBlock = blocks.find((block) => block.id === editingBlockId) ?? null;

    return (
        <div className={b()}>
            {/* PROTOTYPE scoping: wraps user CSS into the grid viewport selector. */}
            <style>{`.${scopeClass}{display:grid;gap:8px;${containerCss}}`}</style>

            <div className={b('toolbar', [stop])}>
                <Button
                    view="flat"
                    size="s"
                    ref={setContainerAnchor}
                    className={stop}
                    onClick={() => setContainerCssOpen((v) => !v)}
                    aria-label="Grid CSS"
                >
                    <Icon data={Gear} className={stop} />
                </Button>
                <Button
                    view="flat"
                    size="s"
                    ref={setTemplatesAnchor}
                    className={stop}
                    onClick={() => setTemplatesOpen((v) => !v)}
                    aria-label="Templates"
                >
                    <Icon data={LayoutHeaderColumns} className={stop} />
                </Button>
                <Button
                    view="flat"
                    size="s"
                    className={stop}
                    onClick={() => {
                        const pos = getPos();
                        if (pos === undefined) return;
                        removeNode({node, pos, tr: view.state.tr, dispatch: view.dispatch});
                    }}
                    aria-label="Remove grid"
                >
                    <Icon data={TrashBin} className={stop} />
                </Button>
            </div>

            <Popup
                anchorElement={templatesAnchor}
                open={templatesOpen}
                onOpenChange={() => setTemplatesOpen(false)}
                placement="bottom-end"
            >
                <Menu className={stop}>
                    {GRID_TEMPLATES.map((template) => (
                        <Menu.Item
                            key={template.id}
                            className={stop}
                            onClick={() => applyTemplate(template)}
                        >
                            {template.title}
                        </Menu.Item>
                    ))}
                </Menu>
            </Popup>

            <div className={`${b('grid')} ${scopeClass}`}>
                {blocks.map((block, i) => (
                    <div
                        key={block.id}
                        className={`${b('item', [stop])} block-${i + 1}`}
                        style={parseInlineCss(block.css)}
                    >
                        <Button
                            view="flat"
                            size="s"
                            className={`${b('item-gear')} ${stop}`}
                            onClick={(e) => {
                                setBlockAnchor(e.currentTarget);
                                setEditingBlockId(block.id);
                            }}
                            aria-label={`Block ${i + 1} CSS`}
                        >
                            <Icon data={Gear} size={14} className={stop} />
                        </Button>
                        <div
                            className={`${b('item-text')} ${stop}`}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => patchBlock(block.id, {text: e.currentTarget.innerText})}
                        >
                            {block.text}
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    className={`${b('add', [stop])} ${stop}`}
                    onClick={addBlock}
                    aria-label="Add block"
                >
                    <Icon data={Plus} />
                </button>
            </div>

            <CssPopup
                anchor={containerAnchor}
                open={containerCssOpen}
                onClose={() => setContainerCssOpen(false)}
                value={containerCss}
                onChange={(value) => onChange({[GridBlockConsts.NodeAttrs.containerCss]: value})}
                placeholder={'grid-template-columns: 1fr 1fr;\ngap: 12px;'}
            />

            {editingBlock && (
                <CssPopup
                    anchor={blockAnchor}
                    open
                    onClose={() => setEditingBlockId(null)}
                    value={editingBlock.css}
                    onChange={(value) => patchBlock(editingBlock.id, {css: value})}
                    placeholder={'background: #eee;\nborder-radius: 8px;'}
                />
            )}
        </div>
    );
};
