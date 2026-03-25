import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const PULL_THRESHOLD = 72;
const MAX_PULL = 110;

/**
 * Wraps scrollable content with a native-feeling pull-to-refresh gesture.
 * Attach to any scroll container whose top can reach y=0.
 */
export default function PullToRefresh({ onRefresh, children }) {
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef(null);
    const y = useMotionValue(0);
    const indicatorOpacity = useTransform(y, [0, PULL_THRESHOLD], [0, 1]);
    const indicatorRotation = useTransform(y, [0, MAX_PULL], [0, 360]);
    const contentY = useTransform(y, (v) => Math.max(0, v));

    function onTouchStart(event) {
        if (window.scrollY > 4 || refreshing) return;
        startY.current = event.touches[0].clientY;
    }

    function onTouchMove(event) {
        if (startY.current === null || refreshing) return;
        const delta = event.touches[0].clientY - startY.current;
        if (delta > 0 && window.scrollY <= 4) {
            y.set(Math.min(delta * 0.45, MAX_PULL));
        }
    }

    async function onTouchEnd() {
        if (startY.current === null) return;
        const pulled = y.get();
        startY.current = null;

        if (pulled >= PULL_THRESHOLD) {
            if (navigator.vibrate) navigator.vibrate([30]);
            setRefreshing(true);
            try {
                await onRefresh?.();
            } finally {
                setRefreshing(false);
            }
        }
        y.set(0);
    }

    return (
        <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="relative"
            aria-label={refreshing ? 'Refreshing…' : undefined}
            aria-live="polite"
        >
            {/* Pull indicator */}
            <motion.div
                style={{ opacity: indicatorOpacity, y: contentY }}
                className="pointer-events-none absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-10 items-center justify-center"
                aria-hidden="true"
            >
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 p-2 shadow-[0_0_20px_rgba(52,211,153,0.25)]">
                    <motion.div style={{ rotate: indicatorRotation }}>
                        <RefreshCw className={`h-5 w-5 text-emerald-300 ${refreshing ? 'animate-spin' : ''}`} />
                    </motion.div>
                </div>
            </motion.div>

            {/* Content shifted down while pulling */}
            <motion.div style={{ y: contentY }}>
                {children}
            </motion.div>
        </div>
    );
}
