import type {useMermaid} from '@diplodoc/mermaid-extension/react';
import type {ThemeType} from '@gravity-ui/uikit';

type MermaidConfig = Parameters<ReturnType<typeof useMermaid>>[0];
type MermaidTheme = NonNullable<MermaidConfig['theme']>;

export type YfmMermaidRuntime = string;
export type YfmMermaidTheme = MermaidTheme | Record<ThemeType, MermaidTheme>;
/**
 * Options passed to Diplodoc. The viewer sets the theme from the `theme` prop
 * and disables `startOnLoad` so it can render only its own diagrams.
 * @see https://github.com/diplodoc-platform/mermaid-extension#custom-initialize-options
 */
export type YfmMermaidOptions = Omit<MermaidConfig, 'theme' | 'startOnLoad'>;
