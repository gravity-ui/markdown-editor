import {PageConstructor, PageConstructorProvider, type Theme} from '@gravity-ui/page-constructor';
import {Flex, Portal, Text} from '@gravity-ui/uikit';
import {ErrorBoundary} from 'react-error-boundary';
import '@diplodoc/page-constructor-extension/styles'; // eslint-disable-line import/order

import type {PageConstructorConfig} from '../types';
import {useSelectContainers} from '../useSelectContainers';

const SELECTOR = '.yfm-page-constructor';

export type YFMPageConstructorRendererProps = {
    html: string;
    config?: PageConstructorConfig;
    containerRef: React.RefObject<HTMLDivElement>;
};

export const YFMPageConstructorRenderer: React.FC<YFMPageConstructorRendererProps> =
    function YFMPageConstructorRenderer({containerRef, config, html}) {
        const {theme} = config || {};

        const containers = useSelectContainers({domRef: containerRef, html, selector: SELECTOR});

        return (
            <>
                {containers.map<React.ReactNode>((container, index) => {
                    const encodedContent = container.getAttribute('data-content-encoded');
                    if (!encodedContent) return null;

                    const decodedContent = decodeURIComponent(encodedContent);
                    const contentData = JSON.parse(decodedContent);

                    return (
                        <Portal key={index} container={container as HTMLElement}>
                            <ErrorBoundary
                                fallbackRender={({error}) => (
                                    <Flex justifyContent="center" alignItems="center">
                                        <Text variant="body-1" color="danger">
                                            {error.message}
                                        </Text>
                                    </Flex>
                                )}
                            >
                                <PageConstructorProvider
                                    ssrConfig={{isServer: false}}
                                    projectSettings={{disableCompress: true}}
                                    theme={theme as Theme}
                                >
                                    <PageConstructor content={contentData} />
                                </PageConstructorProvider>
                            </ErrorBoundary>
                        </Portal>
                    );
                })}
            </>
        );
    };
