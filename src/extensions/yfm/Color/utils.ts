import type {Command} from 'prosemirror-state';

import {Colors} from './const';

export {chainCommands as chainOR} from 'prosemirror-commands';

/**
 * @unsafe
 *
 * Combine a number of command functions into a single function
 * (which calls them one by one until one returns false).
 * If all commands are executed successfully, the changes are applied in a single transaction.
 * If at least one command fails, no changes are applied.
 */
export const chainAND = (...commands: Command[]): Command => {
    return (state, dispatch, view) => {
        let tr = state.tr;

        for (const cmd of commands) {
            if (
                !cmd(
                    // @ts-expect-error – missing the following properties: apply, applyTransaction, reconfigure, toJSON
                    // @d3m1d0v: probably these props should not be used inside commands
                    // TODO: think about way of chaining commads fithout such hacks
                    {...state, ...tr, tr},
                    dispatch
                        ? // eslint-disable-next-line @typescript-eslint/no-loop-func
                          (newTr) => {
                              tr = newTr;
                          }
                        : undefined,
                    view,
                )
            ) {
                return false;
            }
        }

        dispatch?.(tr);

        return true;
    };
};

// see styles
const COLORS: readonly string[] = [
    Colors.Gray,
    Colors.Yellow,
    Colors.Orange,
    Colors.Red,
    Colors.Green,
    Colors.Blue,
    Colors.Violet,
];

export const validateClassNameColorName = (color: string) => COLORS.includes(color);

// eslint-disable-next-line complexity
export const parseStyleColorValue = (color: string) => {
    switch (color) {
        case 'gray':
        case 'grey':
        case 'lightgray':
        case 'lightgrey':
        case 'darkgray':
        case 'darkgrey':
            return Colors.Gray;

        case 'yellow':
        case 'lightyellow':
            return Colors.Yellow;

        case 'orange':
        case 'darkorange':
            return Colors.Orange;

        case 'red':
        case 'darkred':
            return Colors.Red;

        case 'green':
        case 'lightgreen':
        case 'darkgreen':
            return Colors.Green;

        case 'blue':
        case 'lightblue':
        case 'mediumblue':
        case 'darkblue':
            return Colors.Blue;

        case 'violet':
        case 'darkviolet':
        case 'purple':
        case 'mediumpurple':
            return Colors.Violet;

        default:
            return null;
    }
};
