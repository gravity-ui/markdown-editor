import type {Command} from 'prosemirror-state';

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
                    // TODO: придумать способ чейнить команды без подобных хаков
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
