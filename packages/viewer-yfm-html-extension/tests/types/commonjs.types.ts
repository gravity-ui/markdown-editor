import type {
    YfmHtmlBlock,
    YfmHtmlBlockProps,
    toIframeCssVariables,
} from '@gravity-ui/markdown-viewer-yfm-html-extension' with {'resolution-mode': 'require'};

export function shouldExposeCommonJsDeclarations(
    component: typeof YfmHtmlBlock,
    getStyles: typeof toIframeCssVariables,
) {
    const props: YfmHtmlBlockProps = {config: {styles: getStyles({colorLink: 'blue'})}};
    const result: null = component(props);
    return result;
}
