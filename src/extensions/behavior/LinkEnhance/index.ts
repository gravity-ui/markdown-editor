import {Action, ExtensionAuto} from '../../../core';

import {linkTooltipPlugin} from './TooltipPlugin';
import {addLinkCmd2, linkActionSpec2} from './actions';

const linkAction2 = 'addLink';

export type LinkEnhanceOptions = {
    linkKey?: string | null;
};

export const LinkEnhance: ExtensionAuto<LinkEnhanceOptions> = (builder, opts) => {
    builder.addAction(linkAction2, linkActionSpec2).addPlugin(linkTooltipPlugin);

    if (opts?.linkKey) {
        const {linkKey} = opts;
        builder.addKeymap((deps) => ({
            [linkKey]: addLinkCmd2(deps),
        }));
    }
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [linkAction2]: Action;
        }
    }
}
