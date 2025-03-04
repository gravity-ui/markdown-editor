export type {TransformMeta} from '../../types';

// TODO: import runtime type from @diplodoc/latex-extension
export type PluginRuntime =
    | string
    | {
          script: string;
          style: string;
      };
