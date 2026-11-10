import {type ReactElement, useState} from 'react';

import {ClipboardButton} from '@gravity-ui/uikit';

import {ViewerTargets} from '../../components/ViewerTargets/ViewerTargets';
import {cn} from '../../utils/classname';
import {useClientLayoutEffect} from '../../utils/use-client-layout-effect';

import {CodeTextWrappingToggleButton} from './TextWrappingButton';

import './YfmCodeBlockActions.scss';

const b = cn('yfm-code-block');

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

    useClientLayoutEffect(() => {
        const className = b();
        if (element.classList.contains(className)) {
            setOwnsBlock(false);
            return undefined;
        }

        element.classList.add(className);
        setOwnsBlock(true);
        return () => element.classList.remove(className);
    }, [element]);

    if (!ownsBlock) return null;

    return (
        <>
            {lineWrappingButton && <CodeTextWrappingToggleButton codeElement={element} />}
            {copyButton && <ClipboardButton size="m" text={() => getCodeBlockText(element)} />}
        </>
    );
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
