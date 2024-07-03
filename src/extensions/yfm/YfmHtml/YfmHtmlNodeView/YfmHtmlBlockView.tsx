import React, {useEffect, useRef, useState} from 'react';

import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../../../classname';
import {TextAreaFixed as TextArea} from '../../../../forms/TextInput';
import {YfmHtml} from '../YfmHtmlSpecs/const';

import './YfmHtml.scss';
import {useOutsideClick} from '@gravity-ui/uikit';

const cnYfmHtml = cn('YfmHtml');

interface YfmHtmlViewProps {
    view?: EditorView;
    onChange?: (attrs: {[YfmHtml.NodeAttrs.srcdoc]: string}) => void;
    node: Node;
    getPos?: () => number | undefined;
}

// node.attrs.srcdoc
// node, view
// const yfmHtml = useDiplodocHtml();

interface ViewProps {
    className: string;
    html: string;
    onClick: () => void;
}

export const View: React.FC<ViewProps> = ({
    className,
    html,
    onClick,
}) => (
    <div
        dangerouslySetInnerHTML={{__html: html}}
        className={className}
        tabIndex={1}
        onClick={onClick}
    />
);

export const YfmHtmlBlockView: React.FC<YfmHtmlViewProps> = ({node}) => {
    const ref = useRef<HTMLIFrameElement>(null);
    // const textareaRef = useRef<HTMLTextAreaElement>(null);
    const interval = useRef<any>(null);

    const htmlText = node.attrs.srcdoc;
    const [text, setText] = useState(htmlText || '');

    const [editing, setEditing] = useState(false);
    const [selected, setSelected] = useState(false);

    const handleClick = () => {
        setSelected(() => true);
    };

    const handleClickOutside = () => {
        setEditing(() => false);
        setSelected(() => false);
    };

    useEffect(() => {
        if (editing === false && !interval.current) {
            interval.current = setInterval(() => {
                console.log('window.yfmHtmlEditable', (window as any).yfmHtmlEditable);
                if ((window as any).yfmHtmlEditable === 'true') {
                    console.log('yfmHtmlEditable')
                    setEditing(true);
                    (window as any).yfmHtmlEditable = 'false';
                    clearInterval(interval.current);
                }
            }, 100);
        }
    }, [editing]);

    useOutsideClick({ref, handler: handleClickOutside});

    return (
        <div ref={ref} className={cnYfmHtml()}>
            {editing ? (
                <TextArea
                    controlProps={{
                        className: cnYfmHtml('edit', {'prosemirror-stop-event': true}, 'hljs'),
                    }}
                    value={text}
                    onUpdate={(value) => {
                        setText(value);
                    }}
                    autoFocus
                />
            ) : (
                <View
                    className={cnYfmHtml({'selected': Boolean(selected)})}
                    onClick={handleClick}
                    html={text}
                />
            )}
        </div>
    );
};
