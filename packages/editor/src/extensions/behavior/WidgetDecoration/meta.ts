export type Meta<TDescriptor = unknown> =
    | {type: 'add'; descriptor: TDescriptor}
    | {type: 'remove'; id: string};
