export type YfmHtmlBlockTab = 'preview' | 'constructor' | 'html';

export type YfmHtmlBlockEntitySharedState = {
    editing?: boolean;
    activeTab?: YfmHtmlBlockTab;
};
