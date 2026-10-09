import type {NodeType} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {
    type BaseTooltipNode,
    type BaseTooltipPluginOptions,
    BaseTooltipPluginView,
    type TooltipOnChangeCallback,
} from '../BaseTooltip';

import {TooltipButton} from './TooltipButton';

/** @deprecated */
type ButtonContent = (
    view: EditorView,
    node: BaseTooltipNode,
    toggleEdit: () => void,
) => React.ReactElement;

/** @deprecated */
type FormContent = (
    view: EditorView,
    node: BaseTooltipNode,
    onChange?: TooltipOnChangeCallback,
) => React.ReactElement;

/** @deprecated */
interface TooltipMenuOptions extends BaseTooltipPluginOptions {
    disableHideOnBlur?: boolean;
    buttonContent: ButtonContent;
    formContent: FormContent;
}

/** @deprecated */
export class TooltipButtonPluginView extends BaseTooltipPluginView {
    private enableHideOnBlur?: boolean;
    private forceEdit = false;
    private buttonContent: ButtonContent;
    private formContent: FormContent;

    constructor(view: EditorView, options: TooltipMenuOptions) {
        super(view, options);

        this.enableHideOnBlur = options.disableHideOnBlur !== true;
        this.buttonContent = options.buttonContent;
        this.formContent = options.formContent;
        if (this.enableHideOnBlur) {
            (this.view.dom as HTMLElement).addEventListener('focus', this.onViewFocus);
        }
    }

    toggleEdit = () => {
        this.forceEdit = !this.forceEdit;
        this.render();
    };

    destroy(): void {
        super.destroy();
        (this.view.dom as HTMLElement).removeEventListener('focus', this.onViewFocus);
    }

    protected renderContent(currentNode: BaseTooltipNode): React.ReactNode {
        return (
            <>
                {this.forceEdit && this.formContent ? (
                    <div>{this.formContent(this.view, currentNode, this.changeAttrsCb)}</div>
                ) : (
                    <TooltipButton domElem={currentNode.dom} onOutsideClick={this.onOutsideClick}>
                        {this.buttonContent(this.view, currentNode, this.toggleEdit)}
                    </TooltipButton>
                )}
            </>
        );
    }

    protected setCurrentNode(node: NodeType) {
        super.setCurrentNode(node);
        this.currentNode?.dom?.addEventListener('dblclick', this.toggleEdit);
    }

    protected updateTooltipView() {
        this.currentNode?.dom?.removeEventListener('dblclick', this.toggleEdit);
        super.updateTooltipView();
    }

    private onViewFocus = () => {
        this.forceEdit = false;
        this.manualHidden = false;
        this.render();
    };
}
