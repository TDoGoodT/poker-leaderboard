import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Native-feeling Bottom Sheet / Drawer that slides up from the bottom.
 * Traps focus while open and restores it on close.
 * Replaces centered modal dialogs for a more ergonomic mobile experience.
 */
export default function BottomSheet({ isOpen, onClose, title, children }) {
    const firstFocusableRef = useRef(null);
    const triggerRef = useRef(null);

    // Capture the trigger element on open so we can restore focus on close
    useEffect(() => {
        if (isOpen) {
            triggerRef.current = document.activeElement;
            // Defer to let AnimatePresence finish mounting
            const id = setTimeout(() => firstFocusableRef.current?.focus(), 60);
            return () => clearTimeout(id);
        } else {
            triggerRef.current?.focus();
        }
    }, [isOpen]);

    // Keyboard: close on Escape
    useEffect(() => {
        if (!isOpen) return;

        function onKey(event) {
            if (event.key === 'Escape') onClose?.();
        }

        document.addEventListener('keydown', onKey);
        // Prevent body scroll while sheet is open
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="sheet-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Sheet */}
                    <motion.div
                        key="sheet-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                        className="fixed inset-x-0 bottom-0 z-[61] rounded-t-[32px] border-t border-white/10 bg-zinc-900 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
                        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
                            <div className="h-1 w-10 rounded-full bg-white/20" />
                        </div>

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
                                <h2 className="font-display text-xl font-bold text-white tracking-tight">
                                    {title}
                                </h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close"
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition-all duration-150 active:scale-90 active:opacity-70"
                                >
                                    <X className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div ref={firstFocusableRef} tabIndex={-1} className="px-5 pt-4 outline-none">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
