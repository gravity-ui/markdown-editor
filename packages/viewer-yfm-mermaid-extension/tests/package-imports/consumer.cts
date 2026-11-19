import viewer = require('@gravity-ui/markdown-viewer');
import uikit = require('@gravity-ui/uikit');

import extension = require('@gravity-ui/markdown-viewer-yfm-mermaid-extension');

import {assertServerRender} from './assert-server-render.jsx';

assertServerRender(uikit.ThemeProvider, viewer.MarkdownViewer, extension.YfmMermaid);
