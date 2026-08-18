import { forwardRef, useEffect, useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';
import { scrollableAncestor, scrollCaretIntoView } from '@/lib/caret';

type AutoGrowTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    keepCaretInView?: boolean;
};

function resize(el: HTMLTextAreaElement, keepAncestorScroll: boolean) {

    const scroller = keepAncestorScroll ? scrollableAncestor(el) : null;
    const scrollTop = scroller?.scrollTop;

    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;

    if (scroller && scrollTop !== undefined) scroller.scrollTop = scrollTop;
}


const AutoGrowTextarea = forwardRef<HTMLTextAreaElement, AutoGrowTextareaProps>(
    function AutoGrowTextarea({ onInput, rows = 1, keepCaretInView = false, ...props }, forwardedRef) {
        const innerRef = useRef<HTMLTextAreaElement | null>(null);
        // Set by typing, so a programmatic value change doesn't yank the view.
        const caretPending = useRef(false);

        // Size correctly on mount and whenever the incoming value changes.
        useLayoutEffect(() => {
            const el = innerRef.current;
            if (!el) return;
            resize(el, keepCaretInView);

            // For a controlled field this is the LAST resize of the keystroke, so
            // the caret is placed here — anything earlier gets clamped away by the
            // resize above. Still before paint, so the move isn't visible.
            if (keepCaretInView && caretPending.current) {
                caretPending.current = false;
                scrollCaretIntoView(el);
            }
        }, [props.value, props.defaultValue, keepCaretInView]);


        useLayoutEffect(() => {
            const el = innerRef.current;
            if (!el || !props.autoFocus) return;
            const end = el.value.length;
            el.setSelectionRange(end, end);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);


        useEffect(() => {
            const el = innerRef.current;
            if (!el || typeof ResizeObserver === 'undefined') return;
            const observer = new ResizeObserver(() => resize(el, keepCaretInView));
            observer.observe(el);
            return () => observer.disconnect();
        }, [keepCaretInView]);

        return (
            <textarea
                {...props}
                rows={rows}
                ref={(node) => {
                    innerRef.current = node;
                    if (typeof forwardedRef === 'function') forwardedRef(node);
                    else if (forwardedRef) forwardedRef.current = node;
                }}
                onInput={(e) => {
                    resize(e.currentTarget, keepCaretInView);
                    caretPending.current = true;
                    // Uncontrolled fields never re-render, so the layout effect
                    // above won't run — follow the caret here too. The controlled
                    // path repeats it after its resize, which is harmless: the
                    // scroll is a no-op once the caret is already in view.
                    if (keepCaretInView) scrollCaretIntoView(e.currentTarget);
                    onInput?.(e);
                }}
            />
        );
    },
);

export default AutoGrowTextarea;
