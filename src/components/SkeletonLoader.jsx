function Bone({ className = '' }) {
    return (
        <div
            role="presentation"
            className={`animate-pulse rounded-2xl bg-zinc-800 ${className}`}
        />
    );
}

function SkeletonShell({ label, children }) {
    return (
        <div role="status" aria-label={label} aria-live="polite">
            {children}
            <span className="sr-only">{label}</span>
        </div>
    );
}

export function LeaderboardSkeleton() {
    return (
        <SkeletonShell label="Loading leaderboard…">
            <div className="flex w-full flex-col gap-4 pb-28 sm:gap-6">
                <div className="glass-panel p-4 sm:p-5">
                    <Bone className="mb-2 h-3 w-24" />
                    <Bone className="mb-4 h-7 w-52" />
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[0, 1, 2, 3].map((i) => (
                            <Bone key={i} className="h-16" />
                        ))}
                    </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
                    <div className="glass-panel p-5">
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[0, 1, 2].map((i) => (
                                <Bone key={i} className="h-52" />
                            ))}
                        </div>
                    </div>
                    <div className="glass-panel p-5">
                        <Bone className="mb-4 h-6 w-32" />
                        <div className="space-y-3">
                            {[0, 1, 2, 3].map((i) => (
                                <Bone key={i} className="h-16" />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-3">
                    <div className="space-y-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <Bone key={i} className="h-16" />
                        ))}
                    </div>
                </div>
            </div>
        </SkeletonShell>
    );
}

export function HistorySkeleton() {
    return (
        <SkeletonShell label="Loading history…">
            <div className="flex w-full flex-col gap-4 pb-28 sm:gap-6">
                <Bone className="h-36 w-full" />
                {[0, 1, 2, 3].map((i) => (
                    <Bone key={i} className="h-52 w-full" />
                ))}
            </div>
        </SkeletonShell>
    );
}

export function PlayersSkeleton() {
    return (
        <SkeletonShell label="Loading players…">
            <div className="flex w-full flex-col gap-6 pb-28">
                <Bone className="h-40 w-full" />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Bone key={i} className="h-24" />
                    ))}
                </div>
            </div>
        </SkeletonShell>
    );
}

export function PlayerProfileSkeleton() {
    return (
        <SkeletonShell label="Loading player profile…">
            <div className="flex w-full flex-col gap-4 pb-28 sm:gap-6">
                <Bone className="h-4 w-28" />
                <Bone className="h-44 w-full" />
                <div className="grid gap-4 md:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <Bone key={i} className="h-28" />
                    ))}
                </div>
                <Bone className="h-72 w-full" />
                <Bone className="h-48 w-full" />
            </div>
        </SkeletonShell>
    );
}

export function NewSessionSkeleton() {
    return (
        <SkeletonShell label="Loading session form…">
            <div className="flex w-full flex-col gap-6 pb-28">
                <Bone className="h-44 w-full" />
                <div className="grid gap-6 xl:grid-cols-2">
                    <Bone className="h-64 w-full" />
                    <Bone className="h-64 w-full" />
                </div>
            </div>
        </SkeletonShell>
    );
}

export function SettingsSkeleton() {
    return (
        <SkeletonShell label="Loading settings…">
            <div className="flex w-full flex-col gap-6 pb-28">
                <Bone className="h-44 w-full" />
                <div className="grid gap-4 lg:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <Bone key={i} className="h-52" />
                    ))}
                </div>
            </div>
        </SkeletonShell>
    );
}
