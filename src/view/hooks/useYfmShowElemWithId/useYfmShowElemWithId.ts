import {type RefObject, useEffect} from 'react';

const YfmCutCN = {
    Open: 'open',
    Cut: 'yfm-cut',
} as const;

const YfmTabsCN = {
    Active: 'active',
    Tabs: 'yfm-tabs',
    TabList: 'yfm-tab-list',
    Tab: 'yfm-tab',
    TabPanel: 'yfm-tab-panel',
} as const;

const FoldingHeadingsCN = {
    Open: 'open',
    Section: 'heading-section',
} as const;

export function useYfmShowElemWithId(ref: RefObject<HTMLElement>, id: string) {
    useEffect(() => {
        const {current: containerDom} = ref;
        if (!id || !containerDom) return;

        let elem = document.getElementById(id);
        if (!elem || !containerDom.contains(elem)) return;

        while (elem && elem !== containerDom) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            openYfmCut(elem) || openFoldingHeadings(elem, id) || switchYfmTabs(elem);
            elem = elem.parentElement;
        }
    }, [id]);
}

function openYfmCut({classList}: Element): boolean {
    if (classList.contains(YfmCutCN.Cut) && !classList.contains(YfmCutCN.Open)) {
        classList.add(YfmCutCN.Open);
        return true;
    }
    return false;
}

function switchYfmTabs(tabPanelElem: Element): boolean {
    if (
        !tabPanelElem.id ||
        !tabPanelElem.classList.contains(YfmTabsCN.TabPanel) ||
        tabPanelElem.classList.contains(YfmTabsCN.Active)
    )
        return false;
    const tabsElem = tabPanelElem.parentElement;
    if (!tabsElem?.classList.contains(YfmTabsCN.Tabs)) return false;
    const yfmTabList = tabsElem.firstElementChild;
    if (!yfmTabList?.classList.contains(YfmTabsCN.TabList)) return false;

    const tabPanelId = tabPanelElem.id;
    for (const tabElem of Array.from(yfmTabList.children)) {
        if (!tabElem.classList.contains(YfmTabsCN.Tab)) continue;

        const isDesiredElem = tabElem.hasAttribute('aria-controls')
            ? tabElem.getAttribute('aria-controls') === tabPanelId
            : tabElem.textContent === tabPanelElem.getAttribute('data-title');
        tabElem.setAttribute('data-diplodoc-is-active', String(isDesiredElem));
        tabElem.setAttribute('aria-selected', String(isDesiredElem));
        tabElem.classList.toggle(YfmTabsCN.Active, isDesiredElem);
    }
    for (const panelElem of Array.from(tabsElem.children)) {
        if (!panelElem.classList.contains(YfmTabsCN.TabPanel)) continue;

        const isDesiredElem = panelElem.id === tabPanelId;
        panelElem.classList.toggle(YfmTabsCN.Active, isDesiredElem);
    }
    return true;
}

function openFoldingHeadings(elem: Element, id: string): boolean {
    if (
        elem.classList.contains(FoldingHeadingsCN.Section) &&
        !elem.classList.contains(FoldingHeadingsCN.Open) &&
        id !== elem.firstElementChild?.id
    ) {
        elem.classList.add(FoldingHeadingsCN.Open);
        return true;
    }
    return false;
}
