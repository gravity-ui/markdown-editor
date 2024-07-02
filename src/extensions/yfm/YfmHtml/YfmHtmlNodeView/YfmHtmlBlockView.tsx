import React, {useRef, useState} from 'react';

import {EditorView} from 'prosemirror-view';
import {Node} from 'prosemirror-model';
import {YfmHtml} from '../YfmHtmlSpecs/const';

import debounce from 'lodash/debounce';
import {TextAreaFixed as TextArea} from '../../../../forms/TextInput';
import {cn} from '../../../../classname';

import './YfmHtml.scss';

const cnYfmHtml = cn('YfmHtml');


interface YfmHtmlViewProps {
    view?: EditorView;
    onChange?: (attrs: {[YfmHtml.NodeAttrs.srcdoc]: string}) => void;
    node: Node;
    getPos?: () => number | undefined;
}

// useEffect(() => {
//     console.log('yfmHtml', yfmHtml, node, view)
// }, [yfmHtml]);

// node.attrs.srcdoc
// node, view
// const yfmHtml = useDiplodocHtml();

interface ViewProps {
    html: string;
    onClick: () => void;
    onMouseOver: () => void;
    onMouseLeave: () => void;
    hover: boolean;
}

export const View: React.FC<ViewProps> = ({html, onClick, onMouseOver, onMouseLeave, hover}) =>
    <div
        dangerouslySetInnerHTML={{__html: html}}
        className={hover ? 'hovered' : ''}
        tabIndex={1}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
    />;

export const YfmHtmlBlockView: React.FC<YfmHtmlViewProps> = ({node}) => {
    const ref = useRef<HTMLIFrameElement>(null);
    // const textareaRef = useRef<HTMLTextAreaElement>(null);
    const htmlText = node.attrs.srcdoc;
    const [text, setText] = useState(htmlText || '');


    const [editing, setEditing] = useState(false);
    const [hover, setHover] = useState(false);

    const handleMouseOver = () => {
        setHover(() => true);
    };

    const handleMouseLeave = () => {
        debounce(() => {
            setHover(() => true);
        }, 1000);
    };

    const handleClick = () => {
        setEditing(() => true);
    };

    return <div ref={ref}>
        {editing ?
            <TextArea
                controlProps={{
                    className: cnYfmHtml({'prosemirror-stop-event': true}),
                }}
                value={text}
                onUpdate={(value) => {
                    setText(value);
                }}
                autoFocus
            /> : <View
                hover={hover}
                onMouseOver={handleMouseOver}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                html={text} />
        }
    </div>;
};
