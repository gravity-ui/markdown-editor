export const markup = `

#|
||

{gray}(Lorem ipsum dolor sit amet, consectetur adipiscing elit.)

|

>

|

{orange}(Donec id tristique elit.)

|

{red}(Nulla ac neque eu diam porta pretium quis at nulla.)

|

{green}(Nullam consectetur nec sapien eget euismod.)

|

{blue}(Cras sit amet sapien lacus.)

|

{violet}(Maecenas vehicula sagittis purus, ac venenatis ligula scelerisque eu.)

|

>

||
||

{gray}(Suspendisse feugiat ex id ex sollicitudin, consectetur imperdiet mi gravida.)

|

{yellow}(Nulla facilisi.)

|

{orange}(Proin nisi turpis, tincidunt quis nisl in, bibendum euismod magna.)

|

{red}(Quisque nec congue risus, eget commodo enim.)

|

{green}(Donec pharetra venenatis felis, non elementum risus imperdiet non.)

|

{blue}(Aliquam elit nunc, sagittis vel sem pharetra, rhoncus luctus ante.)

|

{violet}(Phasellus vitae augue nec ante commodo semper eget non odio.)

|

Cras sed dolor sapien.

||
||

{gray}(Vestibulum in consectetur urna.)

|

{yellow}(Maecenas imperdiet tincidunt ultrices.)

|

>

|

{red}(Mauris accumsan scelerisque porta.)

|

{green}(Quisque fringilla eleifend est sed interdum.)

|

{blue}(Proin vestibulum lorem vitae ex consequat pharetra.)

|

{violet}(Integer finibus velit ex, sed fringilla urna faucibus in.)

|

Etiam a lacus nisi.

||
||

{gray}(Etiam sollicitudin, diam suscipit gravida accumsan, metus nisl gravida augue, id laoreet lorem elit id urna.)

|

{yellow}(Praesent ultricies erat urna, finibus ultrices lectus tincidunt molestie.)

|

{orange}(Nunc vel dolor malesuada, venenatis mi vitae, suscipit orci.)

|

{red}(Sed finibus facilisis orci sed fringilla.)

|

{green}(Vivamus sed mollis dolor.)

|

{blue}(Mauris sit amet augue posuere, suscipit nulla non, gravida sem.)

|

{violet}(Vivamus augue augue, cursus et auctor quis, porttitor non ipsum.)

|

Nam sollicitudin molestie tortor.

||
||

{gray}(Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.)

|

{yellow}(Donec aliquam dapibus sapien in laoreet.)

|

{orange}(Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.)

|

{red}(Aenean at magna eget tortor fringilla porta at eu lacus.)

|

{green}(Proin ac hendrerit nisl.)

|

>

|

{violet}(Vestibulum eleifend id diam ut efficitur.)

|

Aenean auctor non orci in fringilla.

||
|#

---

#|
||

{gray}(Lorem ipsum dolor sit amet, consectetur adipiscing elit.)

|

{gray}(Curabitur laoreet in dui non auctor.)

|

{gray}(Donec id tristique elit.)

|

{gray}(Nulla ac neque eu diam porta pretium quis at nulla.)

|

{gray}(Nullam consectetur nec sapien eget euismod.)

||
||

^|

{yellow}(Maecenas vehicula sagittis purus, ac venenatis ligula scelerisque eu.)

|

{yellow}(Vestibulum sit amet ipsum ipsum.)

|

{yellow}(Fusce vitae dui placerat nisi tempor aliquam id molestie magna.)

|

{yellow}(Sed pretium tortor tortor, quis efficitur nisi congue nec.)

||
||

{orange}(Sed bibendum pharetra turpis, sed dictum mi ornare et.)

|

{orange}(Proin sagittis, augue ac eleifend elementum, turpis enim consequat arcu, ut tincidunt augue ex nec risus.)

|^|

{orange}(Nulla facilisi.)

|

{orange}(Proin nisi turpis, tincidunt quis nisl in, bibendum euismod magna.)

||
||

{red}(Quisque nec congue risus, eget commodo enim.)

|

{red}(Donec pharetra venenatis felis, non elementum risus imperdiet non.)

|

{red}(Aliquam elit nunc, sagittis vel sem pharetra, rhoncus luctus ante.)

|

{red}(Phasellus vitae augue nec ante commodo semper eget non odio.)

|

{red}(Cras sed dolor sapien.)

||
||

{green}(Fusce metus dolor, suscipit sit amet diam sodales, cursus accumsan mi.)

|

{green}(In lacinia ut urna et cursus.)

|

{green}(Suspendisse non tincidunt mi, ac porta neque.)

|

{green}(Pellentesque elementum sit amet felis sed viverra.)

|

{green}(Vivamus eu suscipit dolor, a malesuada dolor.)

||
||

{blue}(Vestibulum in consectetur urna.)

|

{blue}(Maecenas imperdiet tincidunt ultrices.)

|

{blue}(Donec sit amet lectus id est mattis gravida vitae non lorem.)

|

{blue}(Mauris accumsan scelerisque porta.)

|^
||
||

{violet}(Proin vestibulum lorem vitae ex consequat pharetra.)

|

{violet}(Integer finibus velit ex, sed fringilla urna faucibus in.)

|

{violet}(Donec pellentesque non neque et porttitor.)

|

{violet}(Etiam a lacus nisi.)

|

{violet}(Quisque ut turpis diam. Maecenas ultrices ipsum at lacinia sagittis.)

||
||

^|

Praesent ultricies erat urna, finibus ultrices lectus tincidunt molestie.

|

Nunc vel dolor malesuada, venenatis mi vitae, suscipit orci.

|

Sed finibus facilisis orci sed fringilla.

|

Vivamus sed mollis dolor.

||
|#

---

#|
||11|12|13|14|15|16|17||
||21|22|23|24|25|26|27||
||31|32|33|> |> |36|37||
||41|42|^ |^ |^ |46|47||
||51|52|^ |^ |^ |56|57||
||61|62|63|64|65|66|67||
||71|72|73|74|75|76|77||
|#

`.trim();
