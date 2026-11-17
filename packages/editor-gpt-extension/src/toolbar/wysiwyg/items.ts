export interface GptActions {
    actions: {addGptWidget: {run(params: {}): unknown; isActive(): boolean; isEnable(): boolean}};
}
export const gptItemWysiwyg = {
    hintWhenDisabled: false,
    exec: (editor: GptActions) => {
        editor.actions.addGptWidget.run({});
    },
    isActive: (editor: GptActions) => editor.actions.addGptWidget.isActive(),
    isEnable: (editor: GptActions) => editor.actions.addGptWidget.isEnable(),
};
