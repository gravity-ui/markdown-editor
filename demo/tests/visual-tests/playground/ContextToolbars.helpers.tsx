import {wysiwygToolbarConfigs} from '@gravity-ui/markdown-editor';

import {Playground} from './Playground.helpers';

const {wBoldItemData, wBulletListItemData, wHeading1ItemData, wItalicItemData, wQuoteItemData} =
    wysiwygToolbarConfigs;

export function SelectionToolbarPlayground() {
    return (
        <Playground
            initial="Select this text"
            wysiwygConfig={{
                extensionOptions: {
                    selectionContext: {config: [[wItalicItemData, wBoldItemData]]},
                },
            }}
        />
    );
}

export function CommandMenuPlayground() {
    return (
        <Playground
            initial=""
            wysiwygConfig={{
                extensionOptions: {
                    commandMenu: {
                        actions: [wHeading1ItemData, wBulletListItemData, wQuoteItemData],
                    },
                },
            }}
        />
    );
}
