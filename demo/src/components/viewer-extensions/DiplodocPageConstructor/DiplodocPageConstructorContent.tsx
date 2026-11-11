import {PageConstructor, PageConstructorProvider, Theme} from '@gravity-ui/page-constructor';
import {useThemeType} from '@gravity-ui/uikit';

import './DiplodocPageConstructorContent.css';

export function DiplodocPageConstructorContent({host, theme}: {host: HTMLElement; theme?: Theme}) {
    const themeType = useThemeType();
    const encodedContent = host.getAttribute('data-content-encoded');
    if (!encodedContent) return null;

    const content = JSON.parse(decodeURIComponent(encodedContent));

    return (
        <PageConstructorProvider
            ssrConfig={{isServer: false}}
            projectSettings={{disableCompress: true}}
            theme={theme ?? (themeType === 'dark' ? Theme.Dark : Theme.Light)}
        >
            <PageConstructor content={content} />
        </PageConstructorProvider>
    );
}
