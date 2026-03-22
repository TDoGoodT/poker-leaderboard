import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Trash2 } from 'lucide-react';

const ACTION_WIDTH = 80;
const SWIPE_THRESHOLD = -56;

/**
 * Wraps a list item with a swipe-left-to-reveal delete action.
 * Only renders the reveal action when `onDelete` is provided.
 */
export default function SwipeableItem({ children, onDelete, deleteLabel = 'Delete' }) {
    const x = useMotionValue(0);
    const [revealed, setRevealed] = useState(false);

    const actionOpacity = useTransform(x, [-ACTION_WIDTH, -8], [1, 0]);
    const actionScale = useTransform(x, [-ACTION_WIDTH, 0], [1, 0.8]);

    function handleDragEnd(_, info) {
        const shouldReveal = info.offset.x < SWIPE_THRESHOLD;
        if (shouldReveal) {
            animate(x, -ACTION_WIDTH, { type: 'spring', stiffness: 420, damping: 40 });
            setRevealed(true);
        } else {
            animate(x, 0, { type: 'spring', stiffness: 420, damping: 40 });
            setRevealed(false);
        }
    }

    function handleDelete() {
        animate(x, -window.innerWidth, { duration: 0.28, ease: 'easeIn' }).then(() => {
            onDelete?.();
        });
    }

    function reset() {
        animate(x, 0, { type: 'spring', stiffness: 420, damping: 40 });
        setRevealed(false);
    }

    if (!onDelete) {
        return <>{children}</>;
    }

    return (
        <div className="relative overflow-hidden rounded-[24px]">
            {/* Action panel behind the item */}
            <motion.div
                style={{ opacity: actionOpacity }}
                className="absolute inset-y-0 right-0 flex items-center justify-end rounded-r-[24px] bg-rose-600 pr-3"
                aria-hidden="true"
                style={{ width: ACTION_WIDTH, opacity: actionOpacity }}
            >
                <motion.div style={{ scale: actionScale }} className="flex flex-col items-center gap-1">
                    <Trash2 className="h-5 w-5 text-white" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">{deleteLabel}</span>
                </motion.div>
            </motion.div>

            {/* Draggable content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
                dragElastic={{ left: 0.08, right: 0 }}
                style={{ x }}
                onDragEnd={handleDragEnd}
                className="relative z-10 touch-pan-y"
            >
                {children}
            </motion.div>

            {/* Accessible button visible only when revealed */}
            {revealed && (
                <div className="sr-only">
                    <button type="button" onClick={handleDelete}>
                        {deleteLabel}
                    </button>
                    <button type="button" onClick={reset}>
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
