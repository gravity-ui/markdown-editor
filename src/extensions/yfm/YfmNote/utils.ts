import {nodeTypeFactory} from '../../../utils/schema';
import {NoteNode} from './const';

export const noteTitleType = nodeTypeFactory(NoteNode.NoteTitle);
export const noteType = nodeTypeFactory(NoteNode.Note);
