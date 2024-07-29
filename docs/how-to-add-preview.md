## How to Add Preview for Markup Mode

### Create a Preview component

```ts
export type YfmStaticViewProps = {
    className?: string;
    html: string;
    linksVisited?: boolean;
    noListReset?: boolean;
    qa?: string;
};

export const YfmStaticView = forwardRef<HTMLDivElement, YfmStaticViewProps>(
    function YFMStaticView(props, ref) {
        const {html, linksVisited, noListReset, className, qa} = props;

        return (
            <div
                ref={ref}
                dangerouslySetInnerHTML={{__html: html}}
                className={classnames(
                    'yfm',
                    linksVisited ? 'yfm_links-visited' : undefined,
                    noListReset ? 'yfm_no-list-reset' : undefined,
                    className,
                )}
                data-qa={qa}
            />
        );
    },
);

```
### Add a handler for re-renders

```ts
const {plugins, getValue, allowHTML, breaks, linkify, linkifyTlds, needToSanitizeHtml} = props;
const [html, setHtml] = useState('');
const [meta, setMeta] = useState<object | undefined>({});
const divRef = useRef<HTMLDivElement>(null);

const theme = useThemeValue();

const render = useMemo(
    () =>
        debounce(() => {
            const res = transform(getValue(), {
                allowHTML,
                breaks,
                plugins,
                linkify,
                linkifyTlds,
                needToSanitizeHtml,
            }).result;
            setHtml(res.html);
            setMeta(res.meta);
        }, 200),
        [getValue, allowHTML, breaks, plugins, linkify, linkifyTlds, needToSanitizeHtml, theme],
    );

    useEffect(() => {
        render();
    }, [props, render]);

    return (
        <YfmStaticView
            ref={divRef}
            html={html}
            noListReset
            className="demo-preview"
        />
    );
};
```
### Pass additional properties to useMarkdownEditor

```ts
// ...
const renderPreview = useCallback<RenderPreview>(
    ({getValue}) => (
        <SplitModePreview
            getValue={getValue}
        />
    ),
    [],
);

const editor = useMarkdownEditor({allowHTML: false,
    renderPreview,
    initialEditorMode: 'wysiwyg',
    initialSplitModeEnabled: true,
    initialToolbarVisible: true,
    splitMode: 'horizontal',

});
// ...
```
