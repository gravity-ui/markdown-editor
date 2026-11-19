import viewer = require('@gravity-ui/markdown-viewer');

import extension = require('@gravity-ui/markdown-viewer-yfm-page-constructor-extension');

import {assertServerRender} from './assert-server-render.jsx';

assertServerRender(viewer.MarkdownViewer, extension.YfmPageConstructor);
