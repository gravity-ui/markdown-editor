import type {GridBlockTemplate} from '../types';

import {groupTemplatesForMenu} from './groupTemplates';

const tpl = (id: string, title: string, group?: string): GridBlockTemplate => {
    const template: GridBlockTemplate = {
        id,
        title,
        type: 'block',
        content: title,
        block: {css: '', content: title},
    };

    return group ? {...template, group} : template;
};

describe('groupTemplatesForMenu', () => {
    it('keeps ungrouped templates and groups in first-seen order', () => {
        expect(
            groupTemplatesForMenu(
                [
                    tpl('a', 'A'),
                    tpl('b', 'B1', 'Group B'),
                    tpl('c', 'C'),
                    tpl('d', 'B2', 'Group B'),
                    tpl('e', 'E1', 'Group E'),
                ],
                '',
            ),
        ).toEqual([
            {type: 'template', template: tpl('a', 'A')},
            {
                type: 'group',
                title: 'Group B',
                templates: [tpl('b', 'B1', 'Group B'), tpl('d', 'B2', 'Group B')],
            },
            {type: 'template', template: tpl('c', 'C')},
            {type: 'group', title: 'Group E', templates: [tpl('e', 'E1', 'Group E')]},
        ]);
    });

    it('returns a whole group when the group title matches search', () => {
        expect(
            groupTemplatesForMenu(
                [tpl('a', 'Hero', 'Marketing'), tpl('b', 'Cards', 'Marketing')],
                'market',
            ),
        ).toEqual([
            {
                type: 'group',
                title: 'Marketing',
                templates: [tpl('a', 'Hero', 'Marketing'), tpl('b', 'Cards', 'Marketing')],
            },
        ]);
    });

    it('returns only matching templates inside a group when template titles match search', () => {
        expect(
            groupTemplatesForMenu(
                [tpl('a', 'Hero', 'Marketing'), tpl('b', 'Cards', 'Marketing')],
                'hero',
            ),
        ).toEqual([
            {type: 'group', title: 'Marketing', templates: [tpl('a', 'Hero', 'Marketing')]},
        ]);
    });
});
