import {useState, useEffect, useRef} from 'react';
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

export const useMouseRefPosition = () => {
  const mousePosition = useRef({ x: null, y: null });
  useEffect(() => {
    const updateMousePosition = ev => {
      mousePosition.current = { x: ev.clientX, y: ev.clientY }
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);
  return mousePosition.current;
};

export const useMouseDown = (mf) => {
  useEffect(() => {
      window.addEventListener('mousedown', mf);
      return () => {
      window.removeEventListener('mousedown', mf);
      };
  }, []);
}

export const useMouseMove = (mf) => {
  useEffect(() => {
      window.addEventListener('mousemove', mf);
      return () => {
      window.removeEventListener('mousemove', mf);
      };
  }, []);
}

export const useMouseUp = (mf) => {
    useEffect(() => {
        window.addEventListener('mouseup', mf);
        return () => {
        window.removeEventListener('mouseup', mf);
        };
    }, []);
}