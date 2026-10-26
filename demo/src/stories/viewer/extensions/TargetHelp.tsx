import {useState} from 'react';

import {ViewerTargets} from '@gravity-ui/markdown-viewer';
import {HelpMark, sp} from '@gravity-ui/uikit';
import {useMap} from 'react-use';

export function TargetHelp() {
    const [openCounts, {set: setOpenCount}] = useMap<Record<string, number>>({});

    return (
        <ViewerTargets selector="h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]">
            {(target) => (
                <TargetHelpMark
                    id={target.id}
                    openCount={openCounts[target.id] ?? 0}
                    onOpen={() => setOpenCount(target.id, (openCounts[target.id] ?? 0) + 1)}
                />
            )}
        </ViewerTargets>
    );
}

function TargetHelpMark({
    id,
    openCount,
    onOpen,
}: {
    id: string;
    openCount: number;
    onOpen: () => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <HelpMark
            className={sp({ml: 2})}
            aria-label={`Show ID ${id}`}
            popoverProps={{
                open,
                onOpenChange: (nextOpen) => {
                    if (nextOpen && !open) onOpen();
                    setOpen(nextOpen);
                },
            }}
        >
            <div>
                ID: <code>{id}</code>
            </div>
            <div>Opened: {openCount}</div>
        </HelpMark>
    );
}
