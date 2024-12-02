import {HotkeyProps} from '@gravity-ui/uikit';

import {ActionName} from '../../bundle/config/action-names';
import {ActionStorage} from '../../core';
import {CodeEditor} from '../../markup';
import {ToolbarIconData} from '../../toolbar';

export interface EditorCommand<E> {
    hintWhenDisabled?: boolean | string | (() => string);
    exec(editor: E): void;
    isActive(editor: E): boolean;
    isEnable(editor: E): boolean;
}
export interface WysiwygEditorCommand extends EditorCommand<ActionStorage> {}
export interface MarkupEditorCommand extends EditorCommand<CodeEditor> {}

export interface ToolbarItem {
    icon: ToolbarIconData;
    title: string | (() => string);
    hint?: string | (() => string);
    hotkey?: HotkeyProps['value']; // TODO: @makhnatkin is value connected to ProseMirror API?
}

// customActions?: any; // TODO: @makhnatkin add types
export type ToolbarNode = {
    view: ToolbarItem;
} & (
    | {wysiwygAction: WysiwygEditorCommand; markupAction?: MarkupEditorCommand; customActions?: any}
    | {wysiwygAction?: WysiwygEditorCommand; markupAction: MarkupEditorCommand; customActions?: any}
    | {wysiwygAction?: WysiwygEditorCommand; markupAction?: MarkupEditorCommand; customActions: any}
    | {wysiwygAction: WysiwygEditorCommand; markupAction: MarkupEditorCommand; customActions?: any}
    | {wysiwygAction: WysiwygEditorCommand; markupAction: MarkupEditorCommand; customActions: any}
);

export type ToolbarNodes = Partial<Record<keyof typeof ActionName, ToolbarNode>>;

type ActionNames = keyof typeof ActionName;

export type ToolbarsOrders = {
    markupHidden?: ActionNames[];
    markupMain: ActionNames[] | ActionNames[][];
    wysiwygHidden?: ActionNames[];
    wysiwygMain: ActionNames[] | ActionNames[][];
    wysiwygSelection?: ActionNames[] | ActionNames[][];
    wysiwygSlash?: ActionNames[];
};

export type ToolbarsPreset = {
    toolbarsNodes: ToolbarNodes;
    toolbarsOrders: ToolbarsOrders;
};
