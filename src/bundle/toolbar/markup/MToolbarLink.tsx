import React from 'react';

import {insertLink} from '../../../markup/commands';
import type {CodeEditor} from '../../../markup/editor';
import {ToolbarBaseProps} from '../../../toolbar';
import {ToolbarLink} from '../custom/ToolbarLink';

export type MToolbarLinkProps = ToolbarBaseProps<CodeEditor> & {};

export const MToolbarLink: React.FC<MToolbarLinkProps> = ({focus, onClick, editor, className}) => {
    const selection = editor.cm.getSelection();

    return (
        <ToolbarLink
            focus={focus}
            onClick={onClick}
            className={className}
            active={false}
            enable={true}
            formInitialText={selection}
            formReadOnlyText={Boolean(selection)}
            onSubmit={(url, text) => {
                insertLink({url, text})(editor.cm);
            }}
            removeLink={() => {
                throw new Error('Function not implemented.');
            }}
        />
    );
};
