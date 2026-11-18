import {type ChangeEvent, type KeyboardEvent, useMemo, useRef, useState} from 'react';

import {Link} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {normalizeLinkUrl} from '@gravity-ui/markdown-plugin-header';
import {Icon, Popup, type PopupAnchorElement, Switch, TextInput} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {ButtonNodeAttr} from '../../ButtonSpecs';
import {setButtonAttrs} from '../../commands';

import {StyleSelect} from './StyleSelect';

import './ButtonSettings.scss';

const b = cn('button-settings');

const LINK_ICON_SIZE = 16;

/** The Markdown parser of the editor checks an address the way it checks a link. */
export type LinkParser = Parameters<typeof normalizeLinkUrl>[0];

type ButtonSettingsProps = {
    view: EditorView;
    node: Node;
    getPos: () => number | undefined;
    /** The window opens under this button. */
    anchor: HTMLElement;
    parser: LinkParser;
    /** The reason comes from the popup; Enter and Tab out of the window pass none. */
    onClose: (reason?: string) => void;
};

/** A text field that saves its value on blur, on Enter and when the window closes. */
function useSavedText(saved: string, save: (value: string) => boolean | void, close: () => void) {
    const [value, setValue] = useState(saved);
    const [previous, setPrevious] = useState(saved);
    const [invalid, setInvalid] = useState(false);
    if (previous !== saved) {
        setPrevious(saved);
        setValue(saved);
    }
    const saveValue = () => {
        const next = value.trim();
        const valid = next === saved || save(next) !== false;
        setInvalid(!valid);
        return valid;
    };
    return {
        invalid,
        save: saveValue,
        input: {
            value,
            onUpdate: (next: string) => {
                setValue(next);
                setInvalid(false);
            },
            // The clear button takes the focus and disappears with the text.
            onChange: (event: ChangeEvent<HTMLInputElement>) => {
                if (!event.currentTarget.value) event.currentTarget.focus();
            },
            onBlur: () => {
                saveValue();
            },
            onKeyDown: (event: KeyboardEvent) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                if (saveValue()) close();
            },
        },
    };
}

export function ButtonSettings({view, node, getPos, anchor, parser, onClose}: ButtonSettingsProps) {
    const update = (attrs: Parameters<typeof setButtonAttrs>[1]) => {
        const pos = getPos();
        return pos !== undefined && setButtonAttrs(pos, attrs)(view.state, view.dispatch);
    };
    const label = useSavedText(
        node.attrs[ButtonNodeAttr.Label],
        (value) => update({label: value}),
        onClose,
    );
    const href = useSavedText(
        node.attrs[ButtonNodeAttr.Href],
        (value) => {
            const next = normalizeLinkUrl(parser, value);
            if (value && !next) return false;
            update({href: next});
            return true;
        },
        onClose,
    );
    // A field with an unsaved value has no blur when the window closes.
    const saveAndClose = (reason?: string) => {
        label.save();
        href.save();
        onClose(reason);
    };
    // Tab after the last field and Shift+Tab before the first one return the focus to the editor.
    const closeOnTab = (shiftKey: boolean) => (event: KeyboardEvent) => {
        if (event.key !== 'Tab' || event.shiftKey !== shiftKey) return;
        event.preventDefault();
        saveAndClose();
    };
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
            returnFocus={false}
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
                if (!open && !onButton) saveAndClose(reason);
            }}
        >
            <section
                className={b()}
                role="dialog"
                aria-label={i18n('button-settings')}
                data-qa="button-settings"
            >
                <div className={b('label')}>
                    <TextInput
                        {...label.input}
                        onKeyDown={(event) => {
                            label.input.onKeyDown(event);
                            closeOnTab(true)(event);
                        }}
                        size="l"
                        hasClear
                        controlRef={labelRef}
                        placeholder={i18n('button-placeholder')}
                        controlProps={{'aria-label': i18n('button-label')}}
                    />
                </div>
                <div className={b('style')}>
                    <StyleSelect
                        style={{
                            view: node.attrs[ButtonNodeAttr.View],
                            color: node.attrs[ButtonNodeAttr.Color],
                        }}
                        onUpdate={update}
                    />
                </div>
                <div className={b('fields')}>
                    <TextInput
                        {...href.input}
                        size="l"
                        validationState={href.invalid ? 'invalid' : undefined}
                        errorMessage={<span role="alert">{i18n('button-link-error')}</span>}
                        placeholder={i18n('button-link')}
                        controlProps={{'aria-label': i18n('button-link')}}
                        startContent={
                            <Icon className={b('icon')} data={Link} size={LINK_ICON_SIZE} />
                        }
                    />
                    <Switch
                        size="m"
                        checked={node.attrs[ButtonNodeAttr.Target] === '_blank'}
                        content={i18n('button-new-tab')}
                        controlProps={{onKeyDown: closeOnTab(false)}}
                        onUpdate={(checked) => update({target: checked ? '_blank' : '_self'})}
                    />
                </div>
            </section>
        </Popup>
    );
}
