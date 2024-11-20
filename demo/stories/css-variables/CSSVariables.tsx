import React from 'react';

import {PlaygroundMini} from '../../components/PlaygroundMini';

export const CustomCSSVariablesDemo = React.memo((styles) => {
    return (
        <div style={styles}>
            <PlaygroundMini
                initialEditor="wysiwyg"
                settingsVisible
                withDefaultInitialContent
                stickyToolbar
            />
        </div>
    );
});

CustomCSSVariablesDemo.displayName = 'CustomCSSVariables';
