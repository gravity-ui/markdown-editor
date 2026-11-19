import {MarkdownViewer} from '@gravity-ui/markdown-viewer';

import {YfmPageConstructor} from '@gravity-ui/markdown-viewer-yfm-page-constructor-extension';

import {assertServerRender} from './assert-server-render.jsx';

assertServerRender(MarkdownViewer, YfmPageConstructor);
