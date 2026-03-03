import {ToasterProvider} from '@gravity-ui/uikit';
import {toaster} from '@gravity-ui/uikit/toaster-singleton';
import type {Decorator} from '@storybook/react';

import '@gravity-ui/uikit/styles/styles.scss';

export const withToaster: Decorator = (StoryItem, context) => {
    return (
        <ToasterProvider toaster={toaster}>
            <StoryItem {...context} />
        </ToasterProvider>
    );
};
