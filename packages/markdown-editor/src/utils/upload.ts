// --> public API
export type FileUploadResult = {
    url: string;
    /** override file name */
    name?: string;
    /** override file type */
    type?: string;
};
export type FileUploadHandler = (file: File) => Promise<FileUploadResult>;
// <--

// private API
export type UploadSuccessItem = {
    file: File;
    result: FileUploadResult;
};
export type UploadFailedItem = {
    file: File;
    error: Error;
};
export type BatchUploadResult = {
    success: readonly UploadSuccessItem[];
    failed: readonly UploadFailedItem[];
};

export async function batchUploadFiles(
    files: readonly File[],
    handler: FileUploadHandler,
    onFileUpload?: (item: UploadSuccessItem) => void,
    onFileFail?: (item: UploadFailedItem) => void,
): Promise<BatchUploadResult> {
    const success: UploadSuccessItem[] = [];
    const failed: UploadFailedItem[] = [];
    await Promise.allSettled(
        files.map((file) =>
            handler(file)
                .then(
                    (result) => {
                        const item: UploadSuccessItem = {result, file};
                        success.push(item);
                        onFileUpload?.(item);
                    },
                    (error) => {
                        const item: UploadFailedItem = {error, file};
                        failed.push(item);
                        onFileFail?.(item);
                    },
                )
                .catch(console.error),
        ),
    );
    return {success, failed};
}
