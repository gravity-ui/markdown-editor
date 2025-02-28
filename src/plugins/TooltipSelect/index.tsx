import type {SelectOption, SelectOptionGroup} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {
    type BaseTooltipNode,
    type BaseTooltipPluginOptions,
    BaseTooltipPluginView,
} from '../BaseTooltip';

import {TooltipButton} from './TooltipSelect';

/** @deprecated */
interface TooltipSelectOptions extends BaseTooltipPluginOptions {
    buttonText?: (node: Node) => string;
    items?: SelectOption[] | SelectOptionGroup[];
    buildAttrs: (selectedValue: string) => Record<string, string>;
    withSearch?: boolean;
    disableHideOnBlur?: boolean;
}

/** @deprecated */
export class TooltipSelectPluginView extends BaseTooltipPluginView {
    private buttonText?: (node: Node) => string;
    private items?: SelectOption[] | SelectOptionGroup[];
    private buildAttrs: (selectedValue: string) => Record<string, string>;
    private withSearch: boolean;
    private enableHideOnBlur?: boolean;

    constructor(view: EditorView, options: TooltipSelectOptions) {
        super(view, options);

        this.buttonText = options.buttonText;
        this.items = options.items;
        this.buildAttrs = options.buildAttrs;
        this.withSearch = options.withSearch ?? true;
        this.enableHideOnBlur = options.disableHideOnBlur !== true;

        if (this.enableHideOnBlur) {
            (this.view.dom as HTMLElement).addEventListener('focus', this.onViewFocus);
        }
    }

    destroy(): void {
        super.destroy();
        (this.view.dom as HTMLElement).removeEventListener('focus', this.onViewFocus);
    }

    protected renderContent(currentNode: BaseTooltipNode): React.ReactNode {
        return (
            <TooltipButton
                domRef={currentNode.dom}
                buttonTitle={this.buttonText?.(currentNode.node)}
                items={this.items}
                onUpdate={(v) => this.changeAttrsCb(this.buildAttrs(v), {setFocus: true})}
                withSearch={this.withSearch}
                onOutsideClick={this.onOutsideClick}
            />
        );
    }

    protected onOutsideClick = () => {
        if (this.enableHideOnBlur && !this.view.hasFocus()) {
            this.manualHidden = true;
            this.render();
        }
    };

    private onViewFocus = () => {
        this.manualHidden = false;
        this.render();
    };
}
