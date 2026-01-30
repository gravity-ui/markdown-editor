import type {StateCommand} from '@codemirror/state';

import {DirectiveSyntaxFacet} from '../codemirror/directive-facet';

import {wrapToBlock} from './helpers';

const wrapToYfmCutCurly: StateCommand = wrapToBlock(
    ({lineBreak}) => '{% cut "title" %}' + lineBreak.repeat(2),
    ({lineBreak}) => lineBreak.repeat(2) + '{% endcut %}',
);
const wrapToYfmCutDirective: StateCommand = wrapToBlock(
    ({lineBreak}) => ':::cut [title]' + lineBreak,
    ({lineBreak}) => lineBreak + ':::',
);

export const wrapToYfmCut: StateCommand = (target) => {
    const cmd = target.state.facet(DirectiveSyntaxFacet).shouldInsertDirectiveMarkup('yfmCut')
        ? wrapToYfmCutDirective
        : wrapToYfmCutCurly;
    return cmd(target);
};

export const wrapToYfmNote = wrapToBlock(
    ({lineBreak}) => '{% note info %}' + lineBreak.repeat(2),
    ({lineBreak}) => lineBreak.repeat(2) + '{% endnote %}',
);

export const insertYfmTabs = wrapToBlock(
    ({lineBreak}) => '{% list tabs %}' + lineBreak.repeat(2) + '- Tab name' + lineBreak.repeat(2),
    ({lineBreak}) => lineBreak.repeat(2) + '{% endlist %}',
    {before: '  ', after: ''},
);

export const insertYfmTable = wrapToBlock(
    ({lineBreak}) => ['#|', '||'].join(lineBreak) + lineBreak,
    ({lineBreak}) => lineBreak + ['|', '', '||', '||', '', '|', '', '||', '|#', ''].join(lineBreak),
);
