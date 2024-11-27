import {Node} from '../../../pm/model';
import {EditorView} from '../../../pm/view';

import type {ActionButtonExtraProps} from './actionButtonRenderer';

export type ActionButtonNodesFilter = (node: Node, parent: Node | null) => boolean | void;
export type ActionButtonNodesStrictFilter = (node: Node, parent: Node | null) => boolean;

export type ActionButtonNodeProps =
    | ActionButtonExtraProps
    | ((node: Node, parent: Node | null) => ActionButtonExtraProps);

export type ActionButtonNodeSpec =
    | undefined
    | false
    | ActionButtonNodesFilter
    | {
          filter?: ActionButtonNodesFilter;
          props?: ActionButtonNodeProps;
      };

declare module 'prosemirror-model' {
    interface NodeSpec {
        ActionButton?: ActionButtonNodeSpec;

        disableDropCursor?:
            | boolean
            | ((
                  view: EditorView,
                  pos: ReturnType<EditorView['posAtCoords']>,
                  event: Event,
              ) => boolean);
    }
}
