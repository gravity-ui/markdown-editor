export type DirectiveSyntaxValue = 'disabled' | 'enabled' | 'preserve' | 'overwrite' | 'only';
type DirectiveSyntaxMdPluginValue = 'disabled' | 'enabled' | 'only';
export type DirectiveSyntaxOption = DirectiveSyntaxValue | DirectiveSyntaxOptionObj;

type DirectiveSyntaxOptionObj = {
    [K in keyof MarkdownEditor.DirectiveSyntaxAdditionalSupportedExtensions]?: DirectiveSyntaxValue;
};

const DIRECTIVE_SYNTAX_DEFAULT: DirectiveSyntaxValue = 'disabled';

declare global {
    namespace MarkdownEditor {
        /**
         * Add more keys for you additional supported extensions
         */
        interface DirectiveSyntaxAdditionalSupportedExtensions {}
    }
}

export class DirectiveSyntaxContext {
    #option: DirectiveSyntaxOption;

    protected set option(value: DirectiveSyntaxOption | undefined) {
        this.#option = value ?? DIRECTIVE_SYNTAX_DEFAULT;
    }

    get option(): DirectiveSyntaxOption {
        return this.#option;
    }

    constructor(option: DirectiveSyntaxOption | undefined) {
        this.option = option;
        this.#option = this.option;
    }

    valueFor(key: keyof DirectiveSyntaxOptionObj): DirectiveSyntaxValue {
        let value: DirectiveSyntaxValue | undefined;
        if (typeof this.option === 'object') value = this.option[key];
        if (typeof this.option === 'string') value = this.option;
        return value ?? DIRECTIVE_SYNTAX_DEFAULT;
    }

    mdPluginValueFor(key: keyof DirectiveSyntaxOptionObj): DirectiveSyntaxMdPluginValue {
        const value = this.valueFor(key);
        return value === 'preserve' || value === 'overwrite' ? 'enabled' : value;
    }

    /** helper for wisywig serializer */
    shouldSerializeToDirective(key: keyof DirectiveSyntaxOptionObj, tokenMarkup: unknown): boolean {
        const option = this.valueFor(key);
        if (option === 'overwrite' || option === 'only') return true;
        if (typeof tokenMarkup === 'string') {
            if (tokenMarkup.startsWith(':')) return true;
            if (tokenMarkup.startsWith('{')) return false;
        }
        if (option === 'preserve') return true;
        return false;
    }

    /** helper for markup-mode commands and actions */
    shouldInsertDirectiveMarkup(key: keyof DirectiveSyntaxOptionObj) {
        const value = this.valueFor(key);
        if (value === 'disabled' || value === 'enabled') return false;
        return true;
    }
}
