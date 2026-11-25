import {useEffect, useRef} from 'react';

import {STOP_EVENT_CLASSNAME, cnYfmHtmlBlock as b} from './const';

const LINE_HEIGHT = 20;

export const HtmlSourceEditor: React.FC<{
    value: string;
    onUpdate: (value: string) => void;
}> = ({value, onUpdate}) => {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const contentLines = value.split('\n').length;
    const lineNumbers = Array.from({length: contentLines + 2}, (_, index) => index + 1).join('\n');

    useEffect(() => {
        inputRef.current?.focus({preventScroll: true});
    }, []);

    return (
        <div className={b('code-body')}>
            <div className={b('code-gutter')} aria-hidden="true">
                {lineNumbers}
            </div>
            <div className={b('code-stack')}>
                <div className={b('code-frame')} aria-hidden="true">
                    ::: html
                </div>
                <textarea
                    ref={inputRef}
                    className={`${b('code-input')} ${STOP_EVENT_CLASSNAME}`}
                    value={value}
                    style={{height: contentLines * LINE_HEIGHT}}
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    wrap="off"
                    aria-label="HTML"
                    onChange={(event) => onUpdate(event.target.value)}
                />
                <div className={b('code-frame')} aria-hidden="true">
                    :::
                </div>
            </div>
        </div>
    );
};
