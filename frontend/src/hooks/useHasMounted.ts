'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to handle hydration safety in Next.js App Router.
 * Returns true only after the component has mounted on the client.
 */
export function useHasMounted() {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    return hasMounted;
}
