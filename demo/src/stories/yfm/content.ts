export const markup = {
    textMarks: `
&nbsp;

## YFM text marks

##Monospaced text##
`.trim(),

    yfmNotes: `
&nbsp;

## YFM Notes

{% note info %}

This is info.

{% endnote %}

{% note tip %}

This is a tip.

{% endnote %}

{% note warning %}

This is a warning.

{% endnote %}

{% note alert %}

This is an alert.

{% endnote %}


`.trim(),

    yfmCut: `
&nbsp;

## YFM Cut

{% cut "Cut header" %}

Content displayed when clicked.

{% endcut %}

{% cut "Cut with nested сut header" %}

{% cut "Cut header" %}

Content displayed when clicked.

{% endcut %}

{% endcut %}

`.trim(),

    yfmTabs: `
&nbsp;

## YFM Tabs

{% list tabs %}

- The name of tab1

  The text of tab1.

  * You can use lists.
  * And **other** markup.

- The name of tab2

  The text of tab2.

{% endlist %}
`.trim(),

    yfmHtmlBlock: `
&nbsp;

## Next is YFM HTML block

::: html

<style>
html, body {
    background-color: var(--yfm-html-color-background);
    color: var(--yfm-html-color-text-primary);
    font-size: var(--yfm-html-font-size);
    font-family: var(--yfm-html-font-family);
}
</style>

<h1>Duis faucibus dignissim posuere</h1>
<p>Nam dui purus, imperdiet ut eros a, volutpat blandit lectus. Morbi tincidunt ipsum erat, non mollis augue gravida ac. Morbi mi ligula, blandit quis magna at, porttitor dapibus nisl. Maecenas vestibulum dolor id sem faucibus rutrum. Nullam lacinia ac purus non auctor. Donec rutrum gravida neque, ac viverra nisi molestie et. Curabitur non mi vitae felis mollis rutrum. Phasellus ornare sem vel nunc pulvinar aliquet. Etiam id viverra libero, a accumsan felis. Interdum et malesuada fames ac ante ipsum primis in faucibus.</p>
<p>Mauris nisi nunc, elementum non ornare sit amet, vehicula nec dui. Cras rhoncus dui ut sagittis placerat. Integer eu augue sed risus faucibus mattis. Nulla vitae dapibus lectus. Suspendisse nibh lacus, porttitor in posuere at, elementum non ligula. Phasellus porttitor egestas mi non lacinia. Nunc volutpat nisl sit amet venenatis tincidunt. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Vivamus malesuada tortor nec feugiat euismod. Etiam molestie pretium odio, egestas venenatis eros efficitur eget. Ut at dignissim elit.</p>
<p>Sed congue rhoncus tincidunt. Donec porttitor diam vehicula diam vehicula, vel imperdiet mauris mollis. Sed tincidunt aliquam est eu fermentum. Proin vestibulum bibendum scelerisque. Quisque facilisis neque diam, in aliquam nisl aliquam auctor. Ut at elementum diam, eget tincidunt nulla. Quisque ac ligula eget velit tempor tristique. Aliquam blandit diam magna, et accumsan leo fringilla eget. Phasellus ut lectus urna. Proin ac est et risus elementum consequat. Mauris maximus porttitor massa, in rutrum odio blandit non. Curabitur posuere sem eu nulla efficitur, in placerat diam consectetur. Duis ipsum libero, convallis vel hendrerit sed, bibendum id ipsum. Sed sollicitudin maximus diam, at facilisis ipsum vulputate nec. Morbi eu risus ultricies, bibendum tortor non, interdum sem.</p>
<p>Suspendisse tellus nulla, eleifend in libero id, tristique ultricies odio. Vivamus vel ex laoreet, scelerisque ligula ut, vehicula elit. Ut commodo enim at semper finibus. In at vestibulum ante. Praesent bibendum dolor eget metus semper faucibus. Duis luctus feugiat neque, eu blandit elit molestie in. Quisque laoreet consectetur felis. Suspendisse non turpis id sapien rutrum placerat ac nec dolor. Donec maximus justo ac vestibulum ullamcorper.</p>
<p>Cras tristique dolor magna, quis consectetur odio aliquet at. In eu enim at nisl ultricies ultrices nec et est. Praesent at velit in mi posuere hendrerit nec eu sapien. Fusce sed porta mauris, vitae vehicula mi. Cras facilisis mauris a turpis vehicula fermentum. Suspendisse potenti. Maecenas a odio non neque egestas blandit ac vitae dui. Mauris suscipit turpis efficitur turpis volutpat scelerisque. Proin sit amet lacinia sapien. Donec at metus nec tortor dictum rutrum vehicula at turpis. Etiam consectetur odio in felis sollicitudin mattis.</p>

:::

Simple text again

<div data-yfm-sandbox-mode='shadow' data-yfm-sandbox-content='This is shadow html block content that injected in html by runtime'>This is initial shadow html block content</div>

## Next is another YFM HTML block with styles

::: html

<style>
html, body {
    background-color: var(--yfm-html-color-background);
    color: var(--yfm-html-color-text-primary);
    font-size: var(--yfm-html-font-size);
    font-family: var(--yfm-html-font-family);
}
.container {
    display: flex;
    margin: 20px;
}
.main {
    flex: 2;
    padding: 20px;
}

.main ul {
    list-style-type: disc;
    margin-left: 20px;
}

aside {
    flex: 1;
    padding: 20px;
}

aside blockquote {
    font-style: italic;
    color: var(--yfm-html-color-text-primary);
    border-left: 4px solid var(--yfm-html-color-text-primary);
    padding-left: 10px;
}

.info-block {
    margin-top: 20px;
}

.info-block h3 {
    color: var(--yfm-html-color-text-primary);
}

.info-block ul {
    list-style-type: circle;
    margin-left: 20px;
}

.dark a {
    color: red;
    text-decoration: none;
}
.light a {
    color: blue;
    text-decoration: none;
}

</style>

    <header>
        <h1>Understanding HTML: The Backbone of Web Development</h1>
    </header>

    <div class="container">
        <div class="main">
            <p>HTML, or HyperText Markup Language, is the standard language used to create web pages. It allows developers to structure content and make it accessible and attractive to users.</p>

            <p>HTML was first developed by Tim Berners-Lee in 1991, and since then, it has gone through numerous iterations to become the versatile tool it is today. One of the core tenets of HTML is its simplicity and accessibility. By using a series of tags, you can define various elements on a webpage, such as headings, paragraphs, links, images, and more.</p>

            <p>HTML documents are plain text files that can be created and edited with any text editor. When opened in a web browser, the HTML code is parsed and rendered to display the structured content. This is achieved through the use of various HTML elements, each represented by tags.</p>

            <p>Some of the most commonly used HTML tags include:</p>
            <ul>
                <li><strong>&lt;h1&gt; to &lt;h6&gt;</strong> – Define headings.</li>
                <li><strong>&lt;p&gt;</strong> – Defines a paragraph.</li>
                <li><strong>&lt;a&gt;</strong> – Defines a hyperlink.</li>
                <li><strong>&lt;img&gt;</strong> – Embeds an image.</li>
                <li><strong>&lt;div&gt;</strong> – Defines a division or a section in a document.</li>
            </ul>

            <p>HTML also supports multimedia, allowing you to embed videos, audio, and interactive content. Modern HTML (HTML5) introduces several new elements and APIs to enhance functionality, making it easier for developers to create rich, interactive web experiences.</p>

            <p>In conclusion, understanding HTML is fundamental for web development. Its role in structuring and presenting content on the web is indispensable. Whether you are a beginner or a seasoned developer, mastering HTML opens the door to creating engaging and effective web pages.</p>
        </div>

        <aside>
            <blockquote>
                "HTML is the skeleton of the web, essential and foundational. Every web page owes its structure to HTML."
            </blockquote>

            <div class="info-block">
                <h3>Quick Facts:</h3>
                <ul>
                    <li>Released in 1991 by Tim Berners-Lee.</li>
                    <li>The latest version is HTML5.</li>
                    <li>HTML stands for HyperText Markup Language.</li>
                </ul>
            </div>
        </aside>
    </div>


:::

`.trim(),

    yfmFile: `
&nbsp;

## YFM File

File: {% file src="data:text/plain;base64,Cg==" name="empty.txt" %}
`.trim(),

    yfmTable: `
&nbsp;

## YFM Table

### Simple table

#|
|| **Header1** | **Header2** ||
|| Text | Text ||
|#

### Multiline content

#|
||Text
on two lines
|
- Potatoes
- Carrot
- Onion
- Cucumber||
|#

### Nested tables

#|
|| 1
|

Text before other table

#|
|| 5
| 6||
|| 7
| 8||
|#

Text after other table||
|| 3
| 4||
|#
`.trim(),

    tasklist: `
&nbsp;

## Task lists (additional feature)

- [x] ~~Write the press release~~
- [ ] Update
  the
  website
- [ ] Contact the media
`.trim(),

    latexFormulas: `
&nbsp;

## LaTeX Formulas (optional feature)

Inline formula: $\\sqrt{3x-1}+(1+x)^2$

Block formula:

$$
f(\\relax{x}) = \\int_{-\\infty}^\\infty
    \\hat f(\\xi)\\,e^{2 \\pi i \\xi x}
    \\,d\\xi
$$
`.trim(),

    mermaidDiagram: `
&nbsp;

## Mermaid diagram (optional feature)

\`\`\`mermaid
sequenceDiagram
	Alice->>Bob: Hi Bob
	Bob->>Alice: Hi Alice
\`\`\`
`.trim(),

    foldingHeadings: `
&nbsp;

#+ Heading 1

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum euismod, nulla sit amet sodales porttitor, ligula arcu consectetur justo, sit amet varius orci lorem a augue.

##+ Heading 2

Aenean lobortis rutrum eleifend. Aenean pulvinar orci eros, vitae porta justo interdum at. Proin metus nulla, porta tincidunt tempus eget, faucibus quis nisi.

###+ Heading 3

Praesent ut scelerisque tellus, condimentum iaculis massa. Integer a ante eu eros luctus vestibulum. Phasellus non laoreet lacus, non bibendum dui.

####+ Heading 4

Nunc pellentesque mollis tortor, ut dictum lectus consequat id. Aenean aliquet enim ac facilisis ornare. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.


#####+ Heading 5

Maecenas nec nisl eu dui lacinia consequat. Nulla non lacus varius risus lacinia vulputate. Interdum et malesuada fames ac ante ipsum primis in faucibus.

######+ Heading 6

Nulla facilisi. Pellentesque eu neque tincidunt odio viverra bibendum. Morbi consequat ac nibh id sagittis. Cras fermentum molestie urna vitae viverra.

## Heading 2

Mauris sed sem lorem. Maecenas vitae augue dui. In tempus vitae sem sed ultrices. Sed hendrerit mauris a ultrices rhoncus. Sed eget nibh nec turpis dignissim hendrerit non nec dolor.

# Heading 1

Duis id risus sit amet nunc ornare lobortis sed ut ipsum. Cras tempus ultricies nisl in auctor. Sed nec dui eget odio laoreet commodo at nec libero.
`.trim(),
};
