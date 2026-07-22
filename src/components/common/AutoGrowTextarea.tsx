import { forwardRef, useEffect, useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';

type AutoGrowTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

function resize(el: HTMLTextAreaElement) {
    // Reset first so the element can shrink as well as grow.
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
}

/**
 * A <textarea> that grows its height to fit its content instead of scrolling.
 * Text wraps to the next line when the width is exceeded, and the field keeps
 * expanding downward as the user types. Uncontrolled (defaultValue) friendly.
 */
const AutoGrowTextarea = forwardRef<HTMLTextAreaElement, AutoGrowTextareaProps>(
    function AutoGrowTextarea({ onInput, rows = 1, ...props }, forwardedRef) {
        const innerRef = useRef<HTMLTextAreaElement | null>(null);

        // Size correctly on mount and whenever the incoming value changes.
        useLayoutEffect(() => {
            if (innerRef.current) resize(innerRef.current);
        }, [props.value, props.defaultValue]);

        // Re-fit if the field's width changes (e.g. responsive layout / resize).
        useEffect(() => {
            const el = innerRef.current;
            if (!el || typeof ResizeObserver === 'undefined') return;
            const observer = new ResizeObserver(() => resize(el));
            observer.observe(el);
            return () => observer.disconnect();
        }, []);

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
                    resize(e.currentTarget);
                    onInput?.(e);
                }}
            />
        );
    },
);

export default AutoGrowTextarea;
