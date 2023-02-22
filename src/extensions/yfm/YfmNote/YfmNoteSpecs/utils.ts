import {nodeTypeFactory} from '../../../../utils/schema';
import {NoteNode} from './const';

export const noteType = nodeTypeFactory(NoteNode.Note);
export const noteTitleType = nodeTypeFactory(NoteNode.NoteTitle);
