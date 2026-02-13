import {
    type ComponentType,
    type RefAttributes,
    forwardRef,
    useEffect,
    useRef,
    useState,
} from 'react';

import {ClipboardButton, Portal, useForkRef} from '@gravity-ui/uikit';

import {CodeTextWrappingToggleButton} from './TextWrappingButton';

import './styles.scss';

const VIEWER_CODEBLOCK_CN = 'g-md-viewer-code-block';
const VIEWER_CODEBLOCK_FLOATING_CN = 'g-md-viewer-code-block-floating-container';
const CODEBLOCK_DEFAULT_SELECTOR = '.yfm-code-floating-container';

export type WithCodeBlockActionsOptions = {
    /** @default true */
    copyButton?: boolean;
    /** @default false */
    lineWrappingButton?: boolean;
    /** @default '.yfm-code-floating-container' */
    codeBlockSelector?: string;
    /** Override how text is copied */
    getCodeBlockText?: (element: HTMLElement) => string;
};

export function withCodeBlockActions({
    copyButton = true,
    lineWrappingButton = false,
    codeBlockSelector = CODEBLOCK_DEFAULT_SELECTOR,
    getCodeBlockText = getCodeBlockTextDefault,
}: WithCodeBlockActionsOptions) {
    return <T extends {html: string}>(
        Component: ComponentType<T & RefAttributes<HTMLDivElement>>,
    ) =>
        forwardRef<HTMLDivElement, T>(function WithLatex(props, ref) {
            const {html} = props;
            const [codeBlockElements, setCodeBlockElements] = useState<HTMLElement[]>([]);

            const domRef = useRef<HTMLDivElement>(null);
            const componentRef = useForkRef(ref, domRef);

            useEffect(() => {
                if (!domRef.current) {
                    setCodeBlockElements([]);
                    return undefined;
                }

                const elements = Array.from(
                    domRef.current.querySelectorAll<HTMLElement>(codeBlockSelector),
                );
                setCodeBlockElements(elements);
                const destructors = elements.map((element) => {
                    element.classList.add(VIEWER_CODEBLOCK_CN);

                    const container = element.appendChild(document.createElement('div'));
                    container.classList.add(VIEWER_CODEBLOCK_FLOATING_CN);

                    return () => {
                        element.classList.remove(VIEWER_CODEBLOCK_CN);
                        element.removeChild(container);
                    };
                });

                return () => {
                    destructors.forEach((destructor) => destructor());
                };
            }, [html]);

            return (
                <>
                    <Component {...props} ref={componentRef} />
                    {codeBlockElements.map((element, idx) => {
                        const container = element.querySelector<HTMLElement>(
                            `.${VIEWER_CODEBLOCK_FLOATING_CN}`,
                        );
                        if (!container) return null;

                        return (
                            <Portal key={idx} container={container}>
                                {lineWrappingButton && (
                                    <CodeTextWrappingToggleButton codeElement={element} />
                                )}
                                {copyButton && (
                                    <ClipboardButton
                                        size="m"
                                        text={() => getCodeBlockText(element)}
                                    />
                                )}
                            </Portal>
                        );
                    })}
                </>
            );
        });
}

function getCodeBlockTextDefault(element: HTMLElement) {
    const codeElem = element.querySelector<HTMLElement>('pre code');

    if (!codeElem) return '';

    return Array.from(codeElem.childNodes)
        .filter((node) => {
            // Skip line number spans
            if (node instanceof HTMLElement && node.classList.contains('yfm-line-number')) {
                return false;
            }
            return true;
        })
        .map((node) => node.textContent)
        .join('');
}
