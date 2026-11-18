import type {useMermaid} from '@diplodoc/mermaid-extension/react';
import type {ThemeType} from '@gravity-ui/uikit';

type MermaidConfig = Parameters<ReturnType<typeof useMermaid>>[0];
type MermaidTheme = NonNullable<MermaidConfig['theme']>;

export type YfmMermaidRuntime = string;
export type YfmMermaidTheme = MermaidTheme | Record<ThemeType, MermaidTheme>;
export type YfmMermaidOptions = Omit<MermaidConfig, 'theme' | 'startOnLoad'>;
