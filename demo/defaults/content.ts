export const markup = `
{% cut "First" %}

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

{% endcut %}

{% cut "Second" %}

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

{% endcut %}

{% cut "Third" %}

#|
||11|12|13|14|15|16|17||
||21|22|23|24|25|26|27||
||31|32|33|> |> |36|37||
||41|42|^ |^ |^ |46|47||
||51|52|^ |^ |^ |56|57||
||61|62|63|64|65|66|67||
||71|72|73|74|75|76|77||
|#

{% endcut %}

`.trim();

export const loremIpsum = `

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse enim nisl, tincidunt sit amet auctor vitae, ullamcorper non urna. In feugiat sagittis risus, sit amet accumsan nisi consequat sit amet. Aenean a molestie tellus, vitae volutpat ante. Integer sagittis, turpis a blandit consequat, risus sem consequat ex, at elementum odio diam id nibh. Nam nec neque enim. Integer a risus mattis, lacinia ante nec, commodo eros. Cras erat erat, finibus vitae blandit ut, pulvinar sed quam. Vivamus porta, ipsum non pharetra porttitor, enim felis vestibulum nunc, eget tincidunt erat turpis nec risus. Fusce mollis neque ac porttitor mattis. Aliquam ultrices sagittis bibendum. Praesent a nisi eleifend metus congue fermentum.

Sed egestas enim ac massa varius mattis. Donec scelerisque maximus ultricies. Sed a laoreet dui, at porta enim. Maecenas accumsan a neque et luctus. Nullam venenatis nunc velit, sit amet egestas nisl elementum eu. Sed lobortis volutpat est eu facilisis. Aenean vitae tortor ac massa sagittis tristique at et leo. Nullam faucibus nulla eu vehicula pharetra. Nullam molestie interdum ligula eu malesuada. Pellentesque mauris nunc, volutpat sit amet pretium in, malesuada eu turpis.

Vivamus quis eros aliquet, aliquet odio eget, sollicitudin ligula. Interdum et malesuada fames ac ante ipsum primis in faucibus. Sed vitae justo felis. Proin quis enim leo. Aenean mattis placerat sem, eu suscipit leo venenatis vitae. Proin finibus augue gravida, rhoncus velit sed, ornare ipsum. Mauris pharetra justo quis risus cursus malesuada. In sed ante eget odio elementum viverra et ac libero. Nullam ultrices massa sit amet turpis convallis vehicula. Aenean lobortis magna quis metus aliquet iaculis. Nullam congue, odio vitae blandit placerat, purus velit condimentum nulla, ut placerat metus risus non turpis. Quisque justo neque, posuere id accumsan efficitur, fringilla non ex. Sed metus mauris, blandit eu imperdiet vitae, volutpat sit amet lectus. Proin molestie elit justo, nec fermentum arcu interdum et.

Nam euismod semper diam at efficitur. Maecenas porta velit posuere dui interdum, nec consequat ligula varius. Ut at ultricies ante, sit amet sollicitudin lectus. Praesent iaculis quam sed augue faucibus dapibus. Vestibulum non ipsum eu nibh suscipit pulvinar quis sed augue. Duis rhoncus, mi nec ullamcorper consectetur, urna magna hendrerit quam, id interdum purus arcu in risus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Maecenas gravida magna eget vulputate faucibus. Quisque posuere, velit a maximus fermentum, ex sapien semper erat, sed tincidunt arcu enim ut felis. Vestibulum tempor, ante sit amet laoreet vehicula, nunc eros congue dui, quis imperdiet est leo in leo. Curabitur condimentum sapien nisi, sed volutpat odio euismod condimentum. Etiam velit sapien, finibus bibendum erat nec, feugiat pellentesque quam. Suspendisse cursus nulla ut leo sagittis viverra.

Quisque blandit rutrum nibh sit amet vehicula. Mauris nec interdum leo. Donec suscipit turpis semper pellentesque faucibus. Vestibulum vitae rhoncus tortor. Suspendisse vehicula nisi ac diam mollis, nec pellentesque risus auctor. Suspendisse sit amet turpis ut elit gravida hendrerit nec ornare erat. Nullam eu risus eget est tincidunt luctus sit amet in nisi. Curabitur tellus dolor, accumsan sed maximus nec, lacinia eu neque. Curabitur facilisis a augue semper laoreet. Pellentesque ac faucibus ipsum, a sagittis turpis. Sed eleifend libero ac urna porttitor, vitae finibus velit laoreet. In viverra eros quis iaculis porta.

Praesent viverra velit eu felis facilisis, eu commodo justo volutpat. Nullam eget hendrerit nibh. Vestibulum dui purus, hendrerit sit amet eros in, lacinia laoreet quam. Cras dui mauris, dictum ac ultricies eu, dignissim sit amet metus. Curabitur molestie ante lectus, eget volutpat urna efficitur non. Vivamus lacinia, ligula vitae ornare maximus, dolor odio volutpat velit, sit amet finibus nunc nunc nec augue. Morbi scelerisque tortor at metus ultricies vehicula.

Fusce elementum finibus quam, at tincidunt ipsum egestas eget. Aenean nec ipsum orci. Maecenas quis vehicula purus. Proin tellus magna, euismod eu neque quis, elementum elementum risus. Aenean nibh arcu, bibendum non lacus ac, dapibus pharetra urna. Nunc ut posuere dolor, ac ornare lorem. Nullam varius fringilla sapien ut dapibus. Praesent feugiat dolor nulla, sed commodo orci sagittis eget. Maecenas elementum eros sed magna cursus, quis scelerisque est posuere.

Aliquam aliquam, justo quis ultrices venenatis, eros mi posuere mauris, quis venenatis justo urna sed nisl. Quisque aliquam tincidunt ligula. Proin at tortor eget velit consequat dignissim. Suspendisse metus augue, ultricies sed varius ac, interdum at diam. Mauris laoreet interdum sapien a sagittis. Vivamus dignissim felis a ante porttitor consectetur. Fusce sodales magna et velit cursus dictum. Praesent sodales elit nec lectus porta lobortis. Sed eget metus ut mi ultrices mollis quis eget ante. Vestibulum viverra, magna non euismod mollis, magna lacus egestas ante, posuere faucibus risus diam eu dui. Maecenas maximus lorem orci, sit amet dignissim sem feugiat ac. Morbi tempus purus eu pellentesque bibendum.

Suspendisse dui lorem, fringilla sed arcu quis, aliquet finibus dolor. Sed fringilla aliquet enim nec tempor. Vivamus lectus leo, elementum et risus quis, porta cursus enim. Vivamus ac maximus justo, ac vestibulum risus. Donec ut nunc neque. Mauris in felis vulputate, tincidunt erat in, ullamcorper lorem. Aliquam eu lectus lectus. Nullam eget consectetur leo. Proin venenatis dolor sed magna scelerisque, vulputate imperdiet ante dictum. Etiam ac rhoncus arcu, a dignissim tellus. Donec viverra odio eget lacinia sodales.

Vivamus sed tellus at metus cursus imperdiet. Duis quis turpis elit. Quisque turpis magna, scelerisque in leo id, eleifend porttitor erat. Pellentesque fringilla vel felis eget congue. Pellentesque blandit sem nunc, eu vulputate sem pharetra ac. Ut sed dignissim lectus. Quisque nec nisi ut leo feugiat posuere. Mauris elit sapien, bibendum nec dolor id, pharetra ullamcorper augue. Vivamus et lacus efficitur, fermentum magna id, fermentum neque. Donec aliquet vehicula dapibus. Aenean efficitur nunc eu libero accumsan, sed dignissim neque convallis. Donec eleifend, nisl vel elementum bibendum, eros metus ultricies elit, sodales pharetra magna mauris in est. Donec imperdiet sapien in nibh placerat ultrices id eget quam. Fusce dapibus arcu fringilla dui bibendum, ut rutrum lectus dictum. Pellentesque at elit quam. In id neque in lectus dapibus congue et a tellus.

Donec vitae turpis lacus. Morbi imperdiet ipsum sed consectetur maximus. Quisque sodales ligula lacus, et pulvinar elit efficitur at. Pellentesque augue lorem, ullamcorper sed iaculis nec, blandit ac nunc. Cras purus justo, malesuada nec feugiat vitae, egestas cursus ipsum. Pellentesque in massa fermentum, fermentum lacus ut, rhoncus velit. Phasellus sodales bibendum tellus vel bibendum. Ut convallis libero leo, eu pulvinar lorem tincidunt eget. Vivamus fringilla ipsum quis lacus consectetur ornare.

`.trim();
