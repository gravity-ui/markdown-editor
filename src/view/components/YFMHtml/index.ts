import type {YFMStaticViewProps as OriginalYFMStaticViewProps} from './YFMStaticView';
import {YFMStaticView as OriginalYFMStaticView} from './YFMStaticView';

/**
 * @deprecated use type `YFMStaticViewProps` instead
 */
export type YFMHtmlProps = OriginalYFMStaticViewProps;
export type YFMStaticViewProps = OriginalYFMStaticViewProps;

export {OriginalYFMStaticView as YFMStaticView};
/**
 * @deprecated use component `YFMStaticView` instead
 */
export {OriginalYFMStaticView as YFMHtml};
