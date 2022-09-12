import {ExtensionBuilder} from './ExtensionBuilder';

export function createExtension<Opts extends {}>(
    cb: (builder: ExtensionBuilder, opts?: Opts) => void,
) {
    return (opts?: Opts) => {
        const builder = new ExtensionBuilder();
        cb(builder, opts);
        return builder.build();
    };
}
