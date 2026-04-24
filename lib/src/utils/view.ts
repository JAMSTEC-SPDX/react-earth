import { useEffect, useState, type RefObject } from "react";

/** Takes a DOM element reference as input, and returns always updated width and height. */
export function useView(dom: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: dom.current?.offsetWidth || 1,
    height: dom.current?.offsetHeight || 1,
  });

  useEffect(() => {
    const updateSize = () => {
      const width = dom.current?.offsetWidth || 1;
      const height = dom.current?.offsetHeight || 1;

      if (size.width !== width || size.height !== height) {
        setSize({ width, height });
      }
    };

    updateSize();

    if (!dom.current) return;

    const observer = new ResizeObserver(updateSize);
    observer.observe(dom.current);

    return () => {
      observer.disconnect();
    };
  }, [dom]);

  return size;
}
