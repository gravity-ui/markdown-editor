import {Action as A, Key as K, ModKey as MK} from './const';
import {formatter} from './formatter';

/* eslint-disable */
formatter
    .set(A.__debug, [MK.Mod, MK.Option, ']'])

    .set(A.Cancel, [K.Esc])
    .set(A.Submit, [MK.Mod, K.Enter])

    .set(A.Undo, [MK.Mod, 'z'])
    .set(A.Redo, [MK.Mod, MK.Shift, 'z'])

    .set(A.Bold, [MK.Mod, 'b'])
    .set(A.Italic, [MK.Mod, 'i'])
    .set(A.Underline, [MK.Mod, 'u'])
    .set(A.Strike, [MK.Mod, MK.Shift, 's'])
    .set(A.Code, [MK.Mod, 'e'])
    .set(A.Link, [MK.Mod, 'k'])

    .set(A.Text, {pc: [MK.Ctrl, MK.Shift, '0'], mac: [MK.Cmd, MK.Option, '0']})
    .set(A.Heading1, {pc: [MK.Ctrl, MK.Shift, '1'], mac: [MK.Cmd, MK.Option, '1']})
    .set(A.Heading2, {pc: [MK.Ctrl, MK.Shift, '2'], mac: [MK.Cmd, MK.Option, '2']})
    .set(A.Heading3, {pc: [MK.Ctrl, MK.Shift, '3'], mac: [MK.Cmd, MK.Option, '3']})
    .set(A.Heading4, {pc: [MK.Ctrl, MK.Shift, '4'], mac: [MK.Cmd, MK.Option, '4']})
    .set(A.Heading5, {pc: [MK.Ctrl, MK.Shift, '5'], mac: [MK.Cmd, MK.Option, '5']})
    .set(A.Heading6, {pc: [MK.Ctrl, MK.Shift, '6'], mac: [MK.Cmd, MK.Option, '6']})

    .set(A.BulletList, [MK.Mod, MK.Shift, 'l'])
    .set(A.OrderedList, [MK.Mod, MK.Shift, 'm'])

    .set(A.SinkListItem, [MK.Tab])
    .set(A.LiftListItem, [MK.Shift, MK.Tab])

    .set(A.Quote, [MK.Mod, MK.Shift, '.'])
    .set(A.CodeBlock, {pc: [MK.Ctrl, MK.Shift, 'e'], mac: [MK.Cmd, MK.Option, 'e']})

    .set(A.Cut, {pc: [MK.Ctrl, MK.Shift, '7'], mac: [MK.Cmd, MK.Option, '7']})
    .set(A.Note, {pc: [MK.Ctrl, MK.Shift, '8'], mac: [MK.Cmd, MK.Option, '8']});
/* eslint-enable */
