type TransfromFn = (markup: string) => string;

class MarkdownTransformer {
    private readonly transformers: TransfromFn[];

    constructor(...fns: TransfromFn[]) {
        this.transformers = fns;
    }

    transform(markup: string) {
        let transformedMarkup = markup;
        for (const fn of this.transformers) {
            transformedMarkup = fn(transformedMarkup);
        }
        return transformedMarkup;
    }
}

const emptyParagraphsRegExp =
    /`{1,2}[^`].*?`{1,2}|```[^(```)]*?```[^(```)]*?```\n\r?```|```[\s\S]*?```[s]?|\\.|(\r?\n{4,})/gm;
const transformEmptyParagraph: TransfromFn = (markup) => {
    return markup.replaceAll(emptyParagraphsRegExp, (str: string, match: string) => {
        if (!match) return str;
        const emptyParagraphsCounter = (match.split('\n').length - 2) / 2;
        const res: string[] = [];
        for (let i = 1; i <= emptyParagraphsCounter; i++) res.push('\n\n&nbsp;');
        return str.replace(match, res.join('') + '\n\n');
    });
};

export const mdTransformer = new MarkdownTransformer(transformEmptyParagraph);
