import type {ReactElement} from 'react';

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
    useClientLayoutEffect(() => {
        const hadClass = element.classList.contains(b());
        element.classList.add(b());
        return () => {
            if (!hadClass) element.classList.remove(b());
        };
    }, [element]);

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

    return Array.from(codeElement.childNodes)
        .filter((node) => !(node instanceof Element && node.classList.contains('yfm-line-number')))
        .map((node) => node.textContent)
        .join('');
}
