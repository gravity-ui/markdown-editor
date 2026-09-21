import {type ToolbarAction, splitToolbarActions} from './useToolbarLayout';

const actions: ToolbarAction[] = [
    {id: 'addBlock', group: 'primary', node: null},
    {id: 'raw', group: 'primary', node: null},
    {id: 'background', group: 'style', node: null},
    {id: 'textColor', group: 'style', node: null},
    {id: 'border', group: 'style', node: null},
    {id: 'duplicate', group: 'actions', node: null},
    {id: 'delete', group: 'actions', node: null},
];
const widths = Object.fromEntries(actions.map(({id}) => [id, 32]));

it('keeps actions visible until their widths are measured', () => {
    expect(splitToolbarActions(actions, {}, 100)).toEqual({visible: actions, hidden: []});
});

it('keeps the full toolbar when it fits exactly', () => {
    expect(splitToolbarActions(actions, widths, 282)).toEqual({visible: actions, hidden: []});
});

it('reserves space for the overflow button and its group separator', () => {
    const fitting = splitToolbarActions(actions, widths, 246);
    const narrower = splitToolbarActions(actions, widths, 245);
    expect(fitting.hidden.map(({id}) => id)).toEqual(['duplicate', 'delete']);
    expect(narrower.hidden.map(({id}) => id)).toEqual(['border', 'duplicate', 'delete']);
    expect(narrower.visible.map(({id}) => id)).toEqual([
        'addBlock',
        'raw',
        'background',
        'textColor',
    ]);
});

it('moves all actions into overflow on a very narrow block and restores them on resize', () => {
    expect(splitToolbarActions(actions, widths, 60)).toEqual({visible: [], hidden: actions});
    expect(splitToolbarActions(actions, widths, 400)).toEqual({visible: actions, hidden: []});
});
