import React, { useRef, useEffect } from "react";

/**
 * Hook that alerts clicks outside of the passed ref
 */
function useOutsideAlerter(ref, f=()=>{}) {
    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                f();
            }
        }

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, f]);
}

/**
 * Component that alerts if you click outside of it
 */
export function OutsideAlerter(props) {
    const wrapperRef = useRef(null);
    useOutsideAlerter(wrapperRef, props.f);
    return <div ref={wrapperRef}>{props.children}</div>;
}

export function OutsideAlerterVarFunction(props) {
    const wrapperRef = useRef(null);
    useOutsideAlerter(wrapperRef, props.f(props.q));
    return <div ref={wrapperRef}>{props.children}</div>;
}