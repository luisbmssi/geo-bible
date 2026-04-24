import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean | null {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
        setIsMobile(mq.matches);

        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    return isMobile;
}