import {type RefObject, createContext} from 'react';

// Internal bridge to the popup focus manager; not part of GptDialogProps.
export const GptPromptRefContext = createContext<RefObject<HTMLInputElement> | null>(null);
