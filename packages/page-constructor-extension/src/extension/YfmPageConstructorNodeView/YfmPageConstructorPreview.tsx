import {useMemo} from 'react';

import {loadPageContent} from '@diplodoc/page-constructor-extension/plugin/csr';
import {
    PageConstructor as PageConstructorContent,
    PageConstructorProvider,
    type PageContent,
    type Theme,
} from '@gravity-ui/page-constructor';
import type {ContentTransformerProps} from '@gravity-ui/page-constructor/server';
import {contentTransformer} from '@gravity-ui/page-constructor/server';
import {Flex, Text, useThemeType} from '@gravity-ui/uikit';
import {ErrorBoundary} from 'react-error-boundary';

import {cnYfmPageConstructor} from './YfmPageConstructorView';

const b = cnYfmPageConstructor;

export type TransformerOptions = false | ContentTransformerProps['options'];

export const YfmPageConstructorPreview: React.FC<{
    text: string;
    transformerOptions: TransformerOptions;
}> = ({text = '', transformerOptions}) => {
    const theme = useThemeType();
    const loadResult = useMemo(() => loadPageContent(text), [text]);

    const pageContent = useMemo<PageContent | undefined>(() => {
        if (!loadResult.success) {
            return undefined;
        }
        if (transformerOptions === false) {
            return loadResult.content as PageContent;
        }
        return {
            ...loadResult.content,
            ...contentTransformer({
                content: loadResult.content as PageContent,
                options: transformerOptions,
            }),
        };
    }, [loadResult, transformerOptions]);

    if (!loadResult.success) {
        return (
            <div className={b('error')}>
                <div>{String(loadResult.error)}</div>
            </div>
        );
    }

    return (
        <div className={b('preview')}>
            <ErrorBoundary
                fallbackRender={({error}) => (
                    <Flex justifyContent="center" alignItems="center" width="100%" height="100%">
                        <Text variant="body-1" color="danger">
                            {String(error?.message ?? error)}
                        </Text>
                    </Flex>
                )}
            >
                <PageConstructorProvider
                    ssrConfig={{isServer: false}}
                    projectSettings={{disableCompress: true}}
                    locale={{
                        lang: transformerOptions === false ? undefined : transformerOptions?.lang,
                    }}
                    theme={theme as Theme}
                >
                    <PageConstructorContent content={pageContent} />
                </PageConstructorProvider>
            </ErrorBoundary>
        </div>
    );
};
