import React from 'react';

import {FileItem, insertFiles} from '../../../markup/commands';
import type {CodeEditor} from '../../../markup/editor';
import {ToolbarBaseProps} from '../../../toolbar';
import {ToolbarFile} from '../custom/ToolbarFile';

import {useMarkupToolbarContext} from './context';

export type MToolbarFileProps = ToolbarBaseProps<CodeEditor> & {};

export const MToolbarFile: React.FC<MToolbarFileProps> = ({focus, onClick, editor, className}) => {
    const {uploadHandler} = useMarkupToolbarContext();

    return (
        <ToolbarFile
            focus={focus}
            onClick={onClick}
            className={className}
            active={false}
            enable={true}
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
