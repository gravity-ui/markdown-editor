import React, {RefObject} from 'react';

import {FileItem, insertFiles} from '../../../markup/commands';
import type {CodeEditor} from '../../../markup/editor';
import type {ToolbarBaseProps} from '../../../toolbar';
import {ToolbarFilePopup} from '../custom/ToolbarFilePopup';

import {useMarkupToolbarContext} from './context';

export type MToolbarFilePopupProps = ToolbarBaseProps<CodeEditor> & {
    hide: () => void;
    anchorRef: RefObject<HTMLElement>;
};

export const MToolbarFilePopup: React.FC<MToolbarFilePopupProps> = ({
    focus,
    onClick,
    hide,
    anchorRef,
    editor,
    className,
}) => {
    const {uploadHandler} = useMarkupToolbarContext();

    return (
        <ToolbarFilePopup
            hide={hide}
            focus={focus}
            onClick={onClick}
            anchorRef={anchorRef}
            className={className}
            onSubmit={(fileParams) => insertFiles(editor.cm, [fileParams])}
            uploadHandler={uploadHandler}
            onSuccessUpload={(res) => {
                insertFiles(
                    editor.cm,
                    res.success.map<FileItem>(({result, file}) => ({
                        src: result.url,
                        name: result.name ?? file.name,
                        type: result.type ?? file.type,
                    })),
                );
            }}
        />
    );
};
