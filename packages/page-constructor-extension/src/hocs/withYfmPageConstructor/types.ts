export type {TransformMeta} from '@gravity-ui/markdown-editor/view';

export type PluginRuntime =
    | string
    | {
          script: string;
          style: string;
      };

export type PageConstructorConfig = {
    theme?: string;
};
