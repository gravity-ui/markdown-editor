import {type FormEvent, useMemo, useRef, useState} from 'react';

import {cn} from '@gravity-ui/markdown-editor';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {Button, Popup, type PopupAnchorElement, TextArea, TextInput} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {type TermTarget, closeTermEditor, getTermDefinition, saveTerm} from '../../commands';

import './TermForm.scss';

const b = cn('yfm-term-form');
const keyPattern = /^[\p{L}\p{N}_.-]+$/u;
const displayDefinition = (source: string) => source.replace(/\\([!-/:-@[-`{-~])/g, '$1');

export function TermForm({view, target}: {view: EditorView; target: TermTarget}) {
    const {doc} = view.state;
    const reference = target.edit ? doc.nodeAt(target.from) : null;
    const originalKey: string = reference?.attrs.key ?? '';
    const [label, setLabel] = useState<string>(
        reference?.attrs.label ?? doc.textBetween(target.from, target.to, ' '),
    );
    const [key, setKey] = useState(originalKey);
    const [definition, setDefinition] = useState(() =>
        displayDefinition(getTermDefinition(doc, originalKey)),
    );
    const labelRef = useRef<HTMLInputElement>(null);
    const normalizedKey = key.trim();
    const validKey =
        (target.edit && normalizedKey === originalKey) || keyPattern.test(normalizedKey);

    const anchorElement = useMemo<PopupAnchorElement>(
        () => ({
            contextElement: view.dom,
            getBoundingClientRect: () => {
                const dom = target.edit ? view.nodeDOM(target.from) : null;
                if (dom instanceof HTMLElement) return dom.getBoundingClientRect();
                const rect = view.coordsAtPos(target.from);
                return new DOMRect(
                    rect.left,
                    rect.top,
                    rect.right - rect.left,
                    rect.bottom - rect.top,
                );
            },
        }),
        [target.from, target.edit, view],
    );

    function updateKey(value: string) {
        const current = getTermDefinition(doc, value.trim());
        // TODO: Offer existing terms by label and key in the form.
        if (current) setDefinition(displayDefinition(current));
        setKey(value);
    }

    const canSave = Boolean(label.trim() && normalizedKey && validKey && definition.trim());

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!canSave) return;
        const existing = getTermDefinition(doc, normalizedKey);
        const text =
            definition === displayDefinition(existing)
                ? existing
                : definition
                      .trim()
                      .replace(/\s*\n\s*/g, ' ')
                      .replace(/[!-/:-@[-`{-~]/g, '\\$&');
        saveTerm(view, target.id, normalizedKey, label.trim(), text);
    }

    return (
        <Popup
            open
            anchorElement={anchorElement}
            placement={['bottom-start', 'top-start']}
            offset={4}
            initialFocus={labelRef}
            returnFocus={false}
            onOpenChange={(open, _event, reason) => {
                if (!open) closeTermEditor(view, reason !== 'outside-press');
            }}
        >
            <form className={b()} role="dialog" aria-label={i18n('title')} onSubmit={submit}>
                <label className={b('field')}>
                    {i18n('label')}
                    <TextInput value={label} onUpdate={setLabel} controlRef={labelRef} />
                </label>
                <label className={b('field')}>
                    {i18n('key')}
                    {/* TODO: Revisit manual keys and how to suggest unique keys. */}
                    <TextInput
                        value={key}
                        onUpdate={updateKey}
                        validationState={key && !validKey ? 'invalid' : undefined}
                    />
                </label>
                <label className={b('field')}>
                    {i18n('definition')}
                    <TextArea value={definition} onUpdate={setDefinition} minRows={3} />
                </label>
                <div className={b('actions')}>
                    <Button type="button" onClick={() => closeTermEditor(view, true)}>
                        {i18n('cancel')}
                    </Button>
                    <Button type="submit" view="action" disabled={!canSave}>
                        {i18n('save')}
                    </Button>
                </div>
            </form>
        </Popup>
    );
}
