export const BUILDER_ADD_NODE_RE =
    /builder\s*\.addNode\(\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])\s*,\s*(?:\(|$)/gm;
export const CHAINED_ADD_NODE_RE =
    /\)\s*\.addNode\(\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])\s*,\s*(?:\(|$)/gm;
export const BUILDER_ADD_MARK_RE =
    /builder\s*\.addMark\(\s*\n?\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])\s*,/g;
export const CHAINED_ADD_MARK_RE =
    /\)\s*\n\s*\.addMark\(\s*\n?\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])\s*,/g;
export const NODE_SPEC_RE = /\.addNodeSpec\(\s*\{\s*name:\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])/g;
export const MARK_SPEC_RE = /\.addMarkSpec\(\s*\{\s*name:\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])/g;
export const BUILDER_ADD_ACTION_RE =
    /builder\s*\.addAction\(\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])/g;
export const CHAINED_ADD_ACTION_RE = /\)\s*\.addAction\(\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])/g;
export const ADD_PLUGIN_RE = /\.addPlugin\(\s*(\w+)/g;
export const INPUT_RULE_RE =
    /(?:markInputRule|textblockTypeInputRule|nodeInputRule|wrappingInputRule|inlineNodeInputRule)\s*\(\s*(?:\/([^/]+)\/|{[^}]*open:\s*'([^']*)'[^}]*close:\s*'([^']*)'[^}]*})/g;
export const MD_PLUGIN_RE = /md\.use\(\s*(\w+)/g;
export const OPTIONS_DECL_RE = /export\s+(type|interface)\s+(\w+Options)\b/g;
export const OPTION_FIELD_RE = /^(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*:\s*(.+)$/s;
export const SAME_CALL_RE = /\bsame\s*\(/g;
export const STRING_BINDING_RE = /(?:const|let)\s+([A-Za-z_$][\w$]*)(?::[^=;]+)?\s*=\s*/g;
export const STATE_WRITE_RE = /state\.write\(\s*[`'"]([^`'"]*)[`'"]/g;
export const STATE_TEXT_RE = /state\.text\(\s*[`'"]([^`'"]*)[`'"]/g;
export const STRING_CONST_RE = /(?:export\s+)?const\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g;
export const ENUM_START_RE = /(?:export\s+)?enum\s+(\w+)\s*\{/g;
export const ENUM_ENTRY_RE = /(\w+)\s*=\s*['"]([^'"]+)['"]/g;
export const OBJECT_CONST_START_RE = /(?:export\s+)?const\s+(\w+)\s*=\s*\{/g;
export const CONST_REF_RE = /(?:export\s+)?const\s+(\w+)\s*=\s*(\w+)\s*;/g;
export const IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/;
export const IDENTIFIER_VALUE_RE = /^([A-Za-z_$][\w$.]*)/;
export const STRING_VALUE_RE = /^['"]([^'"]*)['"]/;
export const KEYMAP_OBJECT_DECL_RE = /(?:const|let|var)\s+(\w+)(?::[^=;]+)?=\s*\{/g;
export const STATIC_COMPUTED_ASSIGNMENT_RE = /(\w+)\s*\[\s*(?:'([^']+)'|"([^"]+)")\s*\]\s*=/g;
export const STATIC_MEMBER_ASSIGNMENT_RE = /(\w+)\.(\w+)\s*=/g;
export const PRESET_USE_RE = /\.use\(\s*(\w+)/g;
