import type {
    Exporter,
    ExporterFactoryContext,
    ExporterRegistration,
    ExporterStorage,
} from './types';

export class ExporterRegistry implements ExporterStorage {
    static validateRegistrations(registrations: readonly ExporterRegistration[]): void {
        const names = new Set<string>();

        for (const {name} of registrations) {
            if (typeof name !== 'string' || name.length === 0) {
                throw new Error('Exporter name must be a non-empty string');
            }

            if (names.has(name)) {
                throw new Error(`Exporter "${name}" is already registered`);
            }

            names.add(name);
        }
    }

    readonly #exporters = new Map<string, Exporter>();

    constructor(registrations: readonly ExporterRegistration[], context: ExporterFactoryContext) {
        ExporterRegistry.validateRegistrations(registrations);

        for (const {name, create} of registrations) {
            let exporter: Exporter;

            try {
                exporter = create(context);
            } catch (cause) {
                throw new Error(`Failed to create exporter "${name}"`, {cause});
            }

            if (!exporter || typeof exporter.export !== 'function') {
                throw new Error(
                    `Failed to create exporter "${name}": the export method must be callable`,
                );
            }

            this.#exporters.set(name, exporter);
        }
    }

    getExporter<E extends Exporter>(name: string): E {
        const exporter = this.#exporters.get(name);
        if (!exporter) {
            throw new Error(`Exporter "${name}" is not registered`);
        }
        return exporter as E;
    }
}
