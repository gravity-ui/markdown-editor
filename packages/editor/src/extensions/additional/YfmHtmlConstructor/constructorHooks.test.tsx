import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';

import {useConfirm} from './YfmHtmlConstructorNodeView/useConfirm';
import {
    YFM_HTML_CONSTRUCTOR_PREFERENCES_STORAGE_KEY,
    getHtmlConstructorPreferences,
    setHtmlConstructorPreference,
    useHtmlConstructorPreferences,
} from './preferences';

const environment = globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT?: boolean};
const previousActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
let container: HTMLDivElement;
let root: Root | null;

beforeAll(() => {
    environment.IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
    environment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

beforeEach(() => {
    jest.restoreAllMocks();
    window.localStorage.clear();
    setHtmlConstructorPreference('compactCodeView', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root?.unmount());
    root = null;
    container.remove();
    jest.restoreAllMocks();
});

const PreferenceProbe = () => {
    const preferences = useHtmlConstructorPreferences();
    return <span>{preferences.compactCodeView ? 'compact' : 'split'}</span>;
};

describe('constructor preferences', () => {
    it('updates every mounted consumer and follows storage changes from another tab', () => {
        act(() =>
            root?.render(
                <>
                    <PreferenceProbe />
                    <PreferenceProbe />
                </>,
            ),
        );
        act(() => setHtmlConstructorPreference('compactCodeView', false));
        expect(container.textContent).toBe('splitsplit');

        act(() => {
            window.localStorage.setItem(
                YFM_HTML_CONSTRUCTOR_PREFERENCES_STORAGE_KEY,
                JSON.stringify({compactCodeView: true}),
            );
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key: YFM_HTML_CONSTRUCTOR_PREFERENCES_STORAGE_KEY,
                    storageArea: window.localStorage,
                }),
            );
        });
        expect(container.textContent).toBe('compactcompact');

        act(() => setHtmlConstructorPreference('compactCodeView', false));
        act(() => {
            window.localStorage.clear();
            window.dispatchEvent(new StorageEvent('storage', {key: null}));
        });
        expect(container.textContent).toBe('compactcompact');
    });

    it('keeps the selected preference when persistence fails', () => {
        act(() => root?.render(<PreferenceProbe />));
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('Storage is full', 'QuotaExceededError');
        });

        act(() => setHtmlConstructorPreference('compactCodeView', false));
        act(() =>
            root?.render(
                <>
                    <PreferenceProbe />
                    <PreferenceProbe />
                </>,
            ),
        );

        expect(container.textContent).toBe('splitsplit');
        expect(getHtmlConstructorPreferences().compactCodeView).toBe(false);
    });

    it('removes the shared storage listener after the last consumer unmounts', () => {
        const add = jest.spyOn(window, 'addEventListener');
        const remove = jest.spyOn(window, 'removeEventListener');
        act(() =>
            root?.render(
                <>
                    <PreferenceProbe />
                    <PreferenceProbe />
                </>,
            ),
        );

        const storageListeners = add.mock.calls.filter(([event]) => event === 'storage');
        expect(storageListeners).toHaveLength(1);
        act(() => root?.unmount());
        root = null;

        expect(remove).toHaveBeenCalledWith('storage', storageListeners[0]?.[1]);
    });
});

describe('constructor confirmations', () => {
    let confirmation: ReturnType<typeof useConfirm>;

    const ConfirmationProbe = () => {
        confirmation = useConfirm();
        return null;
    };

    it('cancels a replaced request and resolves the remaining request on unmount', async () => {
        act(() => root?.render(<ConfirmationProbe />));
        let first: Promise<boolean> = Promise.resolve(true);
        let second: Promise<boolean> = Promise.resolve(true);
        act(() => {
            first = confirmation.confirm({title: 'First', message: 'Replace first?'});
            second = confirmation.confirm({title: 'Second', message: 'Replace second?'});
        });

        await expect(first).resolves.toBe(false);
        act(() => root?.unmount());
        root = null;
        await expect(second).resolves.toBe(false);
    });

    it('cancels requests made through a callback retained after unmount', async () => {
        act(() => root?.render(<ConfirmationProbe />));
        const confirm = confirmation.confirm;
        act(() => root?.unmount());
        root = null;

        await expect(confirm({title: 'Deleted', message: 'Continue?'})).resolves.toBe(false);
    });
});
