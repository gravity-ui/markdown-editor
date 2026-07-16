import {
    MobileProvider,
    ThemeProvider,
    Toaster,
    ToasterComponent,
    ToasterProvider,
} from '@gravity-ui/uikit';
import {beforeMount} from '@playwright/experimental-ct-react/hooks';

import '@gravity-ui/uikit/styles/styles.scss';
import '@gravity-ui/markdown-editor/styles/markdown.css'; // eslint-disable-line import/order

const toaster = new Toaster();

beforeMount(async ({App}) => {
    return (
        <ThemeProvider>
            <MobileProvider>
                <ToasterProvider toaster={toaster}>
                    <App />
                    <ToasterComponent />
                </ToasterProvider>
            </MobileProvider>
        </ThemeProvider>
    );
});
