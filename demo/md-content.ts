export const initialMdContent = `
# Это заголовок  {#якорь}

{% cut "Это заголовок ката" %}

**А** *здесь* ~~его~~ ++крутой++ ^к^~о~^н^~т~^е^~н~^т^

![картинка](https://avatars.mds.yandex.net/i?id=38357cac15300bdd8c220a8a68ed2928-5297283-images-thumbs&n=13)

> Сделал дело - дело сделано \`(цитата)\`

{% endcut %}

{% cut "Формулы" %}

Это формула: $\\sqrt{3x-1}+(1+x)^2$

А это блочная формула:

$$

f(\\relax{x}) = \\int_{-\\infty}^\\infty
    \\hat f(\\xi)\\,e^{2 \\pi i \\xi x}
    \\,d\\xi

$$

_Кликни в формулу, чтобы отредактировать её_

{% endcut %}

---

#|
||

Отличная

|

табличкА

|

а сюда вложили картинку и текст отформатировали

||
||

С

|

==полезной==

|

![картинка](https://avatars.mds.yandex.net/i?id=38357cac15300bdd8c220a8a68ed2928-5297283-images-thumbs&n=13 =260x)

||
||

информацией

|

!!!!!!!!!!!!!!!!!!!!!!!!

|

***~~++ТеКсТ ОтФоРмАтИрОвАн++~~***

||
|#

---

{% note info "Минуточку внимания!" %}

* спасибо

  1. за

  2. внимание

     1. вам

  3. от нас

* (списки вложенные)

> > > Цитаты
> >
> > Вложенные
>
> Тоже

А ещё ##monospace## можно **##ком##**##биниро*вать*##

{% endnote %}

---

## code_block example

\`\`\`js
(function(window) {
  window.alert('Hello world!');
})(window);
\`\`\`

---

[ссылка](https://ya.ru)

Colored text: {black}(black) {gray}(gray) {yellow}(yellow) {orange}(orange) {red}(red) {green}(green) {blue}(blue) {violet}(violet)

This *paragraph <span style="color: red;" onmouseenter="alert('XSS inline');"> has* </span> inline html

<div style="color: green;">This text inside custom html.</div> This is text after custom html, but inside html_block too
<main onmouseenter="alert('XSS block');">This is main</main>

<div>This is another html_block</div>

{% list tabs %}

- The name of tab1

  The text of tab1.

  * You can use lists.
  * And **other** markup.

- The name of tab2

  The text of tab2.

- The name of tab3

  The text of tab3.

- The name of tab4

  The text of tab4.

- The name of tab5

  The text of tab5.

- The name of tab6

  The text of tab6.

{% endlist %}

`.trim();
