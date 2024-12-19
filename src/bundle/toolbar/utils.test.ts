import {FileIcon} from '../../icons';
import {ToolbarDataType} from '../../toolbar';
import {WToolbarData} from '../config';

import {flattenPreset} from './utils';
import {WToolbarColors} from './wysiwyg/WToolbarColors';

jest.mock('@gravity-ui/uikit/i18n', () => ({
    addComponentKeysets: jest.fn(),
    t: jest.fn((key: string) => `mocked_${key}`),
    i18n: {
        registerKeyset: jest.fn(),
        keyset: jest.fn(),
    },
}));

const input: WToolbarData = [
    [
        {
            type: ToolbarDataType.SingleButton,
            id: 'undo',
            icon: {data: FileIcon},
            hotkey: 'mod+z',
            hintWhenDisabled: false,
            exec: () => {},
            isActive: () => false,
            isEnable: () => false,
            title: '',
        },
        {
            type: ToolbarDataType.SingleButton,
            id: 'redo',
            icon: {data: FileIcon},
            hotkey: 'mod+shift+z',
            hintWhenDisabled: false,
            exec: () => {},
            isActive: () => false,
            isEnable: () => false,
            title: '',
        },
    ],
    [
        {
            type: ToolbarDataType.SingleButton,
            id: 'bold',
            icon: {data: FileIcon},
            hotkey: 'mod+b',
            exec: () => {},
            isActive: () => false,
            isEnable: () => false,
            title: '',
        },
        {
            type: ToolbarDataType.SingleButton,
            id: 'italic',
            icon: {data: FileIcon},
            hotkey: 'mod+i',
            exec: () => {},
            isActive: () => false,
            isEnable: () => false,
            title: '',
        },
        {
            type: ToolbarDataType.SingleButton,
            id: 'underline',
            icon: {data: FileIcon},
            hotkey: 'mod+u',
            exec: () => {},
            isActive: () => false,
            isEnable: () => false,
            title: '',
        },
        {
            type: ToolbarDataType.SingleButton,
            id: 'strike',
            icon: {data: FileIcon},
            hotkey: 'mod+shift+s',
            exec: () => {},
            isActive: () => false,
            isEnable: () => false,
            title: '',
        },
        {
            type: ToolbarDataType.SingleButton,
            id: 'mono',
            icon: {data: FileIcon},
            exec: () => {},
            isActive: () => false,
            isEnable: () => false,
            title: '',
        },
        {
            type: ToolbarDataType.SingleButton,
            id: 'mark',
            icon: {data: FileIcon},
            exec: () => {},
            isActive: () => false,
            isEnable: () => false,
            title: '',
        },
    ],
    [
        {
            type: ToolbarDataType.ListButton,
            id: 'heading',
            icon: {data: FileIcon},
            withArrow: true,
            title: '',
            data: [
                {
                    id: 'paragraph',
                    icon: {data: FileIcon},
                    hotkey: 'cmd+alt+0',
                    exec: () => {},
                    isActive: () => false,
                    isEnable: () => false,
                    title: '',
                },
                {
                    id: 'heading1',
                    icon: {data: FileIcon},
                    hotkey: 'cmd+alt+1',
                    exec: () => {},
                    isActive: () => false,
                    isEnable: () => false,
                    title: '',
                },
                {
                    id: 'heading2',
                    icon: {data: FileIcon},
                    hotkey: 'cmd+alt+2',
                    exec: () => {},
                    isActive: () => false,
                    isEnable: () => false,
                    title: '',
                },
                {
                    id: 'heading3',
                    icon: {data: FileIcon},
                    hotkey: 'cmd+alt+3',
                    exec: () => {},
                    isActive: () => false,
                    isEnable: () => false,
                    title: '',
                },
                {
                    id: 'heading4',
                    icon: {data: FileIcon},
                    hotkey: 'cmd+alt+4',
                    exec: () => {},
                    isActive: () => false,
                    isEnable: () => false,
                    title: '',
                },
                {
                    id: 'heading5',
                    icon: {data: FileIcon},
                    hotkey: 'cmd+alt+5',
                    exec: () => {},
                    isActive: () => false,
                    isEnable: () => false,
                    title: '',
                },
                {
                    id: 'heading6',
                    icon: {data: FileIcon},
                    hotkey: 'cmd+alt+6',
                    exec: () => {},
                    isActive: () => false,
                    isEnable: () => false,
                    title: '',
                },
            ],
        },
        {
            type: ToolbarDataType.ListButton,
            id: 'lists',
            icon: {data: FileIcon},
            withArrow: true,
            title: '',
            data: [
                {
                    id: 'bulletList',
                    icon: {data: FileIcon},
                    hotkey: 'mod+shift+l',
                    exec: () => {},
                    isActive: () => false,
                    isEnable: () => false,
                    title: '',
                },
                {
                    id: 'orderedList',
                    icon: {data: FileIcon},
                    hotkey: 'mod+shift+m',
                    exec: () => {},
                    isActive: () => false,
                    isEnable: () => false,
                    title: '',
                },
                {
                    id: 'sinkListItem',
                    icon: {data: FileIcon},
                    hotkey: 'tab',
                    exec: () => {},
                    isActive: () => false,
                    isEnable: () => false,
                    title: '',
                },
                {
                    id: 'liftListItem',
                    icon: {data: FileIcon},
                    hotkey: 'shift+tab',
                    exec: () => {},
                    isActive: () => false,
                    isEnable: () => false,
                    title: '',
                },
            ],
        },
        {
            type: ToolbarDataType.ReactComponent,
            id: 'colorify',
            width: 42,
            component: WToolbarColors,
        },
        {
            type: ToolbarDataType.SingleButton,
            id: 'link',
            icon: {data: FileIcon},
            hotkey: 'mod+k',
            exec: () => {},
            isActive: () => false,
            isEnable: () => false,
            title: '',
        },
        {
            type: ToolbarDataType.SingleButton,
            id: 'note',
            icon: {data: FileIcon},
            hotkey: 'cmd+alt+8',
            exec: () => {},
            isActive: () => false,
            isEnable: () => false,
            title: '',
        },
        {
            type: ToolbarDataType.SingleButton,
            id: 'cut',
            icon: {data: FileIcon},
            hotkey: 'cmd+alt+7',
            exec: () => {},
            isActive: () => false,
            isEnable: () => false,
            title: '',
        },
        {
            type: ToolbarDataType.SingleButton,
            id: 'quote',
            icon: {data: FileIcon},
            hotkey: 'mod+shift+.',
            exec: () => {},
            isActive: () => false,
            isEnable: () => false,
            title: '',
        },
    ],
];

const expectedIds = [
    'undo',
    'redo',
    'bold',
    'italic',
    'underline',
    'strike',
    'mono',
    'mark',
    'paragraph',
    'heading1',
    'heading2',
    'heading3',
    'heading4',
    'heading5',
    'heading6',
    'bulletList',
    'orderedList',
    'sinkListItem',
    'liftListItem',
    'colorify',
    'link',
    'note',
    'cut',
    'quote',
];

describe('flattenPreset', () => {
    it('should flatten nested toolbar data and return a correctly flattened structure', () => {
        const result = flattenPreset(input);
        const expectedOutput = expectedIds.map((id) => expect.objectContaining({id}));

        expect(result).toEqual(expect.arrayContaining(expectedOutput));
    });

    it('should return a list of flattened IDs', () => {
        const result = flattenPreset(input);
        const resultIds = result.map((item) => item.id);

        expect(resultIds).toEqual(expectedIds);
    });
});
