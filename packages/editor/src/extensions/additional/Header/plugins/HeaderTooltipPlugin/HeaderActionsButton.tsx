import {useState} from 'react';

import {Link} from '@gravity-ui/icons';
import {Icon, Popup} from '@gravity-ui/uikit';

import type {EditorView} from '#pm/view';
import {i18n} from 'src/i18n/header';
import {type ToolbarBaseProps, ToolbarButtonView} from 'src/toolbar';

import {headerActionType} from '../../HeaderSpecs';
import {type FoundHeader, findHeader, findHeaderAction} from '../../commands';

import {ActionsSettings} from './HeaderSettings';

export function HeaderActionsButton({editor, focus, className}: ToolbarBaseProps<EditorView>) {
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const header = findHeader(editor.state);
    const actions: FoundHeader[] = [];
    header?.node.descendants((node, offset) => {
        if (node.type === headerActionType(editor.state.schema)) {
            actions.push({node, pos: header.pos + offset + 1});
        }
    });
    const open = selectedIndex !== null && actions.length > 0;

    return (
        <>
            <ToolbarButtonView
                ref={setAnchor}
                title={i18n('cta.links')}
                active={open}
                enabled={actions.length > 0}
                hintWhenDisabled={false}
                disableTooltip={open}
                className={className}
                onClick={() => {
                    const selected = findHeaderAction(editor.state);
                    setSelectedIndex(
                        open
                            ? null
                            : Math.max(
                                  0,
                                  actions.findIndex(({pos}) => pos === selected?.pos),
                              ),
                    );
                }}
            >
                <Icon data={Link} size={16} />
                {i18n('cta.links')}
            </ToolbarButtonView>
            {open && (
                <Popup
                    open
                    disablePortal
                    disableFocusOut
                    returnFocus={false}
                    initialFocus={0}
                    anchorElement={anchor}
                    placement={['bottom', 'top']}
                    onOpenChange={(next, _event, reason) => {
                        if (!next) {
                            setSelectedIndex(null);
                            if (reason === 'escape-key') anchor?.focus();
                        }
                    }}
                >
                    <ActionsSettings
                        actions={actions}
                        selectedIndex={selectedIndex}
                        onSelect={setSelectedIndex}
                        editorView={editor}
                        onClose={() => {
                            setSelectedIndex(null);
                            focus();
                        }}
                    />
                </Popup>
            )}
        </>
    );
}
