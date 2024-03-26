import {createContext, useContext} from 'react';

import type {FileUploadHandler} from '../../../utils/upload';

export type MarkupToolbarContextProps = {
    uploadHandler?: FileUploadHandler;
    needToSetDimensionsForUploadedImages?: boolean;
};

const defaultValue: MarkupToolbarContextProps = {};
const MarkupToolbarContext = createContext(defaultValue);

export const MarkupToolbarContextProvider = MarkupToolbarContext.Provider;
export function useMarkupToolbarContext() {
    return useContext(MarkupToolbarContext);
}
