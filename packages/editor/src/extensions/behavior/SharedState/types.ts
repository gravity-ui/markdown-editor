import type {EventEmitter} from 'src/utils/event-emitter';

/** @internal */
export type SharedPluginState = {
    map: Map<string, object>;
    changedKeys: Set<string> | null;
    notifyBus: EventEmitter<{[key: string]: object | undefined}>;
};

/** @internal */
export type TrMeta = {
    actions: SharedStateAction<object>[];
};

/** @internal */
export type SharedStateAction<T extends object> =
    | {
          type: 'set';
          key: string;
          data: T;
      }
    | {
          type: 'update';
          key: string;
          data: Partial<T>;
      }
    | {
          type: 'delete';
          key: string;
      };
