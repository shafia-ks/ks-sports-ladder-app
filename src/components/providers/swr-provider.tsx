"use client";

import { SWRConfig } from 'swr';
import { swrConfig } from '@/hooks/useSWR';

export function SWRProvider({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig value={swrConfig}>
            {children}
        </SWRConfig>
    );
}
