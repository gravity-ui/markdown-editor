import type {Command, Transaction} from '#pm/state';

type Wrapper = (tr: Transaction) => void;

export function wrapCommand(command: Command, ...wrappers: [Wrapper, ...Wrapper[]]): Command {
    return (state, dispatch, view) => {
        return command(
            state,
            dispatch
                ? function dispatchWithWrappers(tr) {
                      for (const wrapper of wrappers) {
                          wrapper(tr);
                      }
                      return dispatch(tr);
                  }
                : undefined,
            view,
        );
    };
}
