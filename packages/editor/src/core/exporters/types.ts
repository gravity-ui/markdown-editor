import type {Fragment, Node, Schema} from 'prosemirror-model';

import type {Logger2} from '../../logger';

export interface Exporter<Result = unknown> {
    export(input: Node | Fragment): Result;
}

export type ExporterFactoryContext = {
    readonly schema: Schema;
    readonly logger: Logger2.ILogger;
};

export type ExporterFactory = (context: ExporterFactoryContext) => Exporter;

export type ExporterRegistration = {
    readonly name: string;
    readonly create: ExporterFactory;
};

export interface ExporterStorage {
    getExporter<E extends Exporter>(name: string): E;
}
