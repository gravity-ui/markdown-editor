import {type ReactElement, useState} from 'react';

import {ClipboardButton} from '@gravity-ui/uikit';

import {ViewerTargets} from '../../components/ViewerTargets/ViewerTargets';
import {cn} from '../../utils/classname';
import {useClientLayoutEffect} from '../../utils/use-client-layout-effect';

import {CodeTextWrappingToggleButton} from './TextWrappingButton';

import './YfmCodeBlockActions.scss';

const b = cn('yfm-code-block');
const blockClass = b();
const blockInstances = new WeakMap<HTMLElement, SetBlockOwner[]>();

type SetBlockOwner = (ownsBlock: boolean) => void;

export interface YfmCodeBlockActionsProps {
    /** @default true */
    copyButton?: boolean;
    /** @default true */
    lineWrappingButton?: boolean;
    /** @default '.yfm-clipboard, .yfm-code-floating-container' */
    codeBlockSelector?: string;
    getCodeBlockText?: (element: HTMLElement) => string;
}

export function YfmCodeBlockActions({
    copyButton = true,
    lineWrappingButton = true,
    codeBlockSelector = '.yfm-clipboard, .yfm-code-floating-container',
    getCodeBlockText = getCodeBlockTextDefault,
}: YfmCodeBlockActionsProps): ReactElement {
    return (
        <ViewerTargets selector={codeBlockSelector} as="div" className={b('actions')}>
            {(element) => (
                <CodeBlockActions
                    element={element}
                    copyButton={copyButton}
                    lineWrappingButton={lineWrappingButton}
                    getCodeBlockText={getCodeBlockText}
                />
            )}
        </ViewerTargets>
    );
}

function CodeBlockActions({
    element,
    copyButton,
    lineWrappingButton,
    getCodeBlockText,
}: {element: HTMLElement} & Required<Omit<YfmCodeBlockActionsProps, 'codeBlockSelector'>>) {
    const [ownsBlock, setOwnsBlock] = useState(false);

    useClientLayoutEffect(() => registerBlockActions(element, setOwnsBlock), [element]);

    if (!ownsBlock) return null;

    return (
        <>
            {lineWrappingButton && <CodeTextWrappingToggleButton codeElement={element} />}
            {copyButton && <ClipboardButton size="m" text={() => getCodeBlockText(element)} />}
        </>
    );
}

function registerBlockActions(element: HTMLElement, setOwnsBlock: SetBlockOwner) {
    const queue = blockInstances.get(element) ?? [];
    const isFirst = queue.length === 0;
    const canJoin = !isFirst || !element.classList.contains(blockClass);
    setOwnsBlock(isFirst && canJoin);
    if (!canJoin) return undefined;

    if (isFirst) {
        blockInstances.set(element, queue);
        element.classList.add(blockClass);
    }
    queue.push(setOwnsBlock);

    return () => {
        const index = queue.indexOf(setOwnsBlock);
        queue.splice(index, 1);
        if (index !== 0) return;

        const nextOwner = queue[0];
        if (nextOwner) {
            nextOwner(true);
        } else {
            blockInstances.delete(element);
            element.classList.remove(blockClass);
        }
    };
}

function getCodeBlockTextDefault(element: HTMLElement) {
    const codeElement = element.querySelector('pre code');
    if (!codeElement) return '';

    const copy = codeElement.cloneNode(true) as Element;
    copy.querySelectorAll('.yfm-line-number, .yfm-code-prompt').forEach((decoration) => {
        decoration.remove();
    });
    return copy.textContent ?? '';
}
