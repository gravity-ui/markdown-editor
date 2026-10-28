import {PluginKey} from 'prosemirror-state';
import type {DecorationSet} from 'prosemirror-view';

export type GptPluginState = {
    decorations: DecorationSet;
    disablePromptPresets: boolean;
};

const key = new PluginKey<GptPluginState>('gpt-widget');
export {key as pluginKey};

export type GptWidgetMeta =
    | {
          action: 'show';
          from: number;
          to: number;
      }
    | {
          action: 'hide';
      };
