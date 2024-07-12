import React, {useEffect, useRef, useState} from 'react';

import {Ellipsis as DotsIcon, Eye} from '@gravity-ui/icons';
import {Button, Icon, Label, Menu, Popup, useThemeValue} from '@gravity-ui/uikit';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../../../classname';
import {TextAreaFixed as TextArea} from '../../../../forms/TextInput';
import {i18n} from '../../../../i18n/common';
import {useBooleanState} from '../../../../react-utils/hooks';
import {removeNode} from '../../../../utils/remove-node';
import {getYfmHtmlCssVariables} from '../../../../view/hocs/withYfmHtml/utils';
import {YfmHtmlConsts} from '../YfmHtmlSpecs/const';

export const cnYfmHtml = cn('YfmHtml');
export const cnHelper = cn('YfmHtmlHelper');

import './YfmHtml.scss';

const b = cnYfmHtml;

interface YfmHtmlViewProps {
    html: string;
    onСlick: () => void;
    styles?: Record<string, string>;
    innerClassName?: string;
}

export function generateID() {
    return Math.random().toString(36).substr(2, 8);
}

const PADDING = 20;

const empty = {};

const YfmHtmlPreview: React.FC<YfmHtmlViewProps> = ({
    html,
    innerClassName,
    onСlick,
    styles = empty,
}) => {
    const ref = useRef<HTMLIFrameElement>(null);
    const [height, setHeight] = useState('100%');

    const handleLoadIFrameHandler = () => {
        const contentWindow = ref.current?.contentWindow;

        if (contentWindow) {
            const height = contentWindow.document.documentElement.scrollHeight + PADDING + 'px';
            setHeight(height);

            contentWindow.document.addEventListener('dblclick', () => {
                onСlick();
            });
        }
    };

    useEffect(() => {
        ref.current?.addEventListener('load', handleLoadIFrameHandler);
        return () => {
            ref.current?.removeEventListener('load', handleLoadIFrameHandler);
        };
    }, [html]);

    return (
        <iframe
            style={{
                height,
                ...styles,
            }}
            ref={ref}
            title={generateID()}
            frameBorder={0}
            className={b('Content', innerClassName)}
            srcDoc={html}
        />
    );
};

const CodeEditMode: React.FC<{
    initialText: string;
    onSave: (v: string) => void;
    onCancel: () => void;
}> = ({initialText, onSave, onCancel}) => {
    const [text, setText] = useState(initialText || '\n');

    return (
        <div className={b({editing: true})}>
            <div className={b('Editor')}>
                <TextArea
                    className={b('CodeEditor')}
                    controlProps={{
                        className: cnHelper({'prosemirror-stop-event': true}),
                    }}
                    value={text}
                    onUpdate={(v) => {
                        setText(v);
                    }}
                    autoFocus
                />

                <div className={b('Controls')}>
                    <div>
                        <Button onClick={onCancel} view={'flat'}>
                            <span className={cnHelper({'prosemirror-stop-event': true})}>
                                {i18n('cancel')}
                            </span>
                        </Button>
                        <Button onClick={() => onSave(text)} view={'action'}>
                            <span className={cnHelper({'prosemirror-stop-event': true})}>
                                {i18n('save')}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const YfmHtmlView: React.FC<{
    view: EditorView;
    onChange: (attrs: {[YfmHtmlConsts.NodeAttrs.srcdoc]: string}) => void;
    node: Node;
    getPos: () => number | undefined;
}> = ({onChange, node, getPos, view}) => {
    const [editing, setEditing, unsetEditing, toggleEditing] = useBooleanState(
        Boolean(node.attrs[YfmHtmlConsts.NodeAttrs.newCreated]),
    );

    const theme = useThemeValue();

    const bodyStyles = window.getComputedStyle(document.body);
    const colorTextPrimary = bodyStyles.getPropertyValue('--g-color-text-primary');
    const colorBackground = bodyStyles.getPropertyValue('--g-color-base-background');

    const styles = getYfmHtmlCssVariables({
        colorTextPrimary,
        colorBackground,
    });

    const [menuOpen, , , toggleMenuOpen] = useBooleanState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    const handleClick = () => {
        setEditing();
    };

    if (editing) {
        return (
            <CodeEditMode
                initialText={node.attrs[YfmHtmlConsts.NodeAttrs.srcdoc]}
                onCancel={unsetEditing}
                onSave={(v) => {
                    onChange({[YfmHtmlConsts.NodeAttrs.srcdoc]: v});
                    unsetEditing();
                }}
            />
        );
    }

    return (
        <div className={b()} onDoubleClick={setEditing}>
            <Label className={b('Label')} icon={<Icon size={16} data={Eye} />}>
                {i18n('preview')}
            </Label>
            <YfmHtmlPreview
                html={node.attrs[YfmHtmlConsts.NodeAttrs.srcdoc]}
                onСlick={handleClick}
                innerClassName={theme}
                styles={styles}
            />
            <div className={b('Menu')}>
                <Button
                    onClick={toggleMenuOpen}
                    ref={buttonRef}
                    size={'s'}
                    className={cnHelper({'prosemirror-stop-event': true})}
                >
                    <Icon data={DotsIcon} className={cnHelper({'prosemirror-stop-event': true})} />
                </Button>
                <Popup
                    anchorRef={buttonRef}
                    open={menuOpen}
                    onClose={toggleMenuOpen}
                    placement={['bottom-end']}
                >
                    <Menu>
                        <Menu.Item
                            onClick={() => {
                                toggleEditing();
                                toggleMenuOpen();
                            }}
                        >
                            {i18n('edit')}
                        </Menu.Item>
                        <Menu.Item
                            onClick={() => {
                                const pos = getPos();
                                if (pos === undefined) return;
                                removeNode({
                                    node,
                                    pos,
                                    tr: view.state.tr,
                                    dispatch: view.dispatch,
                                });
                            }}
                        >
                            {i18n('remove')}
                        </Menu.Item>
                    </Menu>
                </Popup>
            </div>
        </div>
    );
};
