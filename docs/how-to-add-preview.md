## How to Add Preview for Markup Mode

### Create a Preview component

You can use the component `YfmStaticView` that [provides the editor bundle](https://github.com/gravity-ui/markdown-editor/blob/main/src/view/components/YfmHtml/YfmStaticView.tsx)

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
