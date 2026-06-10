"use client";

import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import Lenis from "lenis";

type LenisContextType = Lenis | null;

const LenisContext = createContext<LenisContextType>(null);

export function useLenis() {
  const lenis = useContext(LenisContext);
  return lenis;
}

export default function LenisProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const lenisInstance = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });
    let frameId = 0;
    let published = false;

    function raf(time: number) {
      if (!published) {
        published = true;
        setLenis(lenisInstance);
      }
      lenisInstance.raf(time);
      frameId = requestAnimationFrame(raf);
    }

    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenisInstance.destroy();
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
