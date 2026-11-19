import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {ThemeProvider} from '@gravity-ui/uikit';

import {YfmMermaid} from '@gravity-ui/markdown-viewer-yfm-mermaid-extension';

import {assertServerRender} from './assert-server-render.jsx';

assertServerRender(ThemeProvider, MarkdownViewer, YfmMermaid);
