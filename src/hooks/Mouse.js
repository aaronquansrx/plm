import {useState, useEffect} from 'react';
export const useMousePosition = () => {
  const [
    mousePosition,
    setMousePosition
  ] = useState({ x: null, y: null });
  useEffect(() => {
    const updateMousePosition = ev => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);
  return mousePosition;
};

export const useMouseUp = (mf) => {
    useEffect(() => {
        window.addEventListener('mouseup', mf);
        return () => {
        window.removeEventListener('mouseup', mf);
        };
    }, [])
}