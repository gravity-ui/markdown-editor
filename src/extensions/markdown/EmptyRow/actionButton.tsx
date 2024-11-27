import React from 'react';

import {Plus} from '@gravity-ui/icons';
import {Button, ButtonProps, Icon} from '@gravity-ui/uikit';

export type ActionButtonButtonProps = Omit<ButtonProps, 'size' | 'view' | 'children'>;

export const ActionButtonButton: React.FC<ActionButtonButtonProps> = (props) => {
    return (
        <>
            <Button
                {...props}
                className="ActionButtonButton"
                id="ActionButtonButton"
                size="xs"
                view="flat"
            >
                <Icon data={Plus} />
            </Button>
        </>
    );
};
