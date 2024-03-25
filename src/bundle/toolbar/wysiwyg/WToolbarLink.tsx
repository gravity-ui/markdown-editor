import React from 'react';

import {ActionStorage} from '../../../core';
import {ToolbarBaseProps} from '../../../toolbar';
import {ToolbarLink} from '../custom/ToolbarLink';

export type WToolbarLinkProps = ToolbarBaseProps<ActionStorage> & {};

export const WToolbarLink: React.FC<WToolbarLinkProps> = ({focus, onClick, editor, className}) => {
    const action = editor.actions.link;
    const active = action.isActive();
    const enable = action.isEnable();
    const meta = action.meta();

    return (
        <ToolbarLink
            focus={focus}
            onClick={onClick}
            className={className}
            active={active}
            enable={enable}
            formInitialText={meta.text()}
            formReadOnlyText={meta.hasSelection}
            onSubmit={(url: string, text: string) => {
                action.run({href: url, text: meta.hasSelection ? '' : text});
            }}
            removeLink={() => {
                action.run({href: ''});
            }}
        />
    );
};
