import React, { useRef, useEffect } from "react";

/**
 * Hook that alerts clicks outside of the passed ref
 */
function useOutsideClickFunction(ref, func) {
  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        func();
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, func]);
}

/**
 * Component that alerts if you click outside of it
 */
export function OutsideClickFunction(props) {
  const wrapperRef = useRef(null);
  useOutsideClickFunction(wrapperRef, props.func);

  return <div ref={wrapperRef}>{props.children}</div>;
}