import {type KeyboardEvent, useEffect, useMemo, useRef, useState} from 'react';

import {Link} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {Icon, Popup, type PopupAnchorElement, Switch, TextInput} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {setButtonAttrs} from '../../commands';

import {StyleSelect} from './StyleSelect';

import './ButtonSettings.scss';

const b = cn('button-settings');

const LINK_ICON_SIZE = 16;

type ButtonSettingsProps = {
    view: EditorView;
    node: Node;
    pos: number;
    /** The window opens under this button. */
    anchor: HTMLElement;
    onClose: (focusEditor: boolean) => void;
};

/** A text field that saves its value on blur, Enter and Escape. */
function useSavedText(saved: string, save: (value: string) => void, close: () => void) {
    const [value, setValue] = useState(saved);
    useEffect(() => setValue(saved), [saved]);
    const saveValue = () => {
        if (value.trim() !== saved) save(value.trim());
    };
    return {
        value,
        onUpdate: setValue,
        onBlur: saveValue,
        onKeyDown: (event: KeyboardEvent) => {
            if (event.key === 'Escape') saveValue();
            if (event.key !== 'Enter') return;
            event.preventDefault();
            saveValue();
            close();
        },
    };
}

export function ButtonSettings({view, node, pos, anchor, onClose}: ButtonSettingsProps) {
    const update = (attrs: Parameters<typeof setButtonAttrs>[1]) =>
        setButtonAttrs(pos, attrs)(view.state, view.dispatch);
    const close = () => onClose(true);
    const label = useSavedText(node.attrs.label, (value) => update({label: value}), close);
    const href = useSavedText(node.attrs.href, (value) => update({href: value}), close);
    const labelRef = useRef<HTMLInputElement>(null);
    // Floating UI adds a focus element next to a DOM anchor, and ProseMirror owns the editor DOM.
    const anchorElement = useMemo<PopupAnchorElement>(
        () => ({
            contextElement: anchor,
            getBoundingClientRect: () => anchor.getBoundingClientRect(),
        }),
        [anchor],
    );
    return (
        <Popup
            open
            className={b('popup')}
            anchorElement={anchorElement}
            placement={['bottom-start', 'top-start']}
            offset={4}
            initialFocus={labelRef}
            onOpenChange={(open, event, reason) => {
                // A click on the button keeps its window open.
                const onButton =
                    reason === 'outside-press' &&
                    event?.target instanceof window.Node &&
                    anchor.contains(event.target);
                if (!open && !onButton) onClose(reason === 'escape-key');
            }}
        >
            <section
                className={b()}
                role="dialog"
                aria-label={i18n('button-settings')}
                data-qa="button-settings"
            >
                <TextInput
                    {...label}
                    size="l"
                    hasClear
                    controlRef={labelRef}
                    placeholder={i18n('button-placeholder')}
                    controlProps={{'aria-label': i18n('button-label')}}
                />
                <div className={b('divider')} />
                <div className={b('fields')}>
                    <StyleSelect
                        style={{view: node.attrs.view, color: node.attrs.color}}
                        onUpdate={update}
                    />
                    <TextInput
                        {...href}
                        size="l"
                        placeholder={i18n('button-link')}
                        controlProps={{'aria-label': i18n('button-link')}}
                        startContent={
                            <Icon className={b('icon')} data={Link} size={LINK_ICON_SIZE} />
                        }
                    />
                    <Switch
                        size="m"
                        checked={node.attrs.target === '_blank'}
                        content={i18n('button-new-tab')}
                        onUpdate={(checked) => update({target: checked ? '_blank' : '_self'})}
                    />
                </div>
            </section>
        </Popup>
    );
}
