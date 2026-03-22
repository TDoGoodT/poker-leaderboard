import { useCallback, useRef } from 'react';

const DEFAULT_DELAY = 600;

/**
 * Returns props to spread onto any interactive element to detect a long-press.
 * Works for both touch (mobile) and mouse (desktop).
 *
 * Example:
 *   const handlers = useLongPress(() => openContextMenu(item));
 *   <div {...handlers}>...</div>
 */
export default function useLongPress(callback, { delay = DEFAULT_DELAY } = {}) {
    const timerRef = useRef(null);
    const triggeredRef = useRef(false);

    const start = useCallback(
        (event) => {
            triggeredRef.current = false;
            timerRef.current = setTimeout(() => {
                triggeredRef.current = true;
                if (navigator.vibrate) {
                    navigator.vibrate([50]);
                }
                callback(event);
            }, delay);
        },
        [callback, delay],
    );

    const clear = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    return {
        onTouchStart: start,
        onTouchEnd: clear,
        onTouchMove: clear,
        onMouseDown: start,
        onMouseUp: clear,
        onMouseLeave: clear,
        // Prevent the regular click from firing immediately after a long-press
        onClick: useCallback(
            (event) => {
                if (triggeredRef.current) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            },
            [],
        ),
    };
}
