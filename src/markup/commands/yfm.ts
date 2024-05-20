import type {StateCommand} from '@codemirror/state';

import {wrapToBlock} from './helpers';

export const wrapToYfmCut: StateCommand = wrapToBlock(
    ({lineBreak}) => '{% cut "title" %}' + lineBreak.repeat(2),
    ({lineBreak}) => lineBreak.repeat(2) + '{% endcut %}',
);

export const wrapToYfmNote = wrapToBlock(
    ({lineBreak}) => '{% note info %}' + lineBreak.repeat(2),
    ({lineBreak}) => lineBreak.repeat(2) + '{% endnote %}',
);

// todo: remove
export const wrapToYfmBlock = wrapToBlock(
    ({lineBreak}) => '{% block %}' + lineBreak.repeat(2),
    ({lineBreak}) => lineBreak.repeat(2) + '{% endblock %}',
);

// todo: remove
export const wrapToYfmLayout = wrapToBlock(
    ({lineBreak}) =>
        '{% layout gap=l %}' + lineBreak.repeat(2) + '{% block %}' + lineBreak.repeat(2),
    ({lineBreak}) =>
        lineBreak.repeat(2) + '{% endblock %}' + lineBreak.repeat(2) + '{% endlayout %}',
);

export const insertYfmTabs = wrapToBlock(
    ({lineBreak}) => '{% list tabs %}' + lineBreak.repeat(2) + '- Tab name' + lineBreak.repeat(2),
    ({lineBreak}) => lineBreak.repeat(2) + '{% endlist %}',
    {before: '  ', after: '', skipEmptyLine: true},
);

export const insertYfmTable = wrapToBlock(
    ({lineBreak}) => ['#|', '||'].join(lineBreak) + lineBreak,
    ({lineBreak}) => lineBreak + ['|', '', '||', '||', '', '|', '', '||', '|#', ''].join(lineBreak),
);
