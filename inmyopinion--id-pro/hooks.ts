/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback, useRef, useEffect } from 'react';

export const useApiMutation = <TData, TVariables>(
    apiFunction: (variables: TVariables, sourceDocumentContent: string | null) => Promise<TData>
) => {
    const [data, setData] = useState<TData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<number | undefined>(undefined);
    const isMountedRef = useRef(true);

    const clearProgressInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            clearProgressInterval();
        };
    }, [clearProgressInterval]);

    const mutate = useCallback(async (
        variables: TVariables, 
        onSuccess?: (data: TData) => void, 
        sourceDocumentContent: string | null = null
    ) => {
        if (!isMountedRef.current) return;
        setLoading(true);
        setError(null);
        setData(null);
        setProgress(0);
        clearProgressInterval();

        intervalRef.current = window.setInterval(() => {
            setProgress(p => {
                let increment;
                if (p < 50) increment = 0.5 + Math.random() * 1.5; // Faster start
                else if (p < 85) increment = 0.3 + Math.random() * 1; // Slower middle
                else increment = 0.1 + Math.random() * 0.4; // Very slow end
                const newProgress = p + increment;
                return Math.min(newProgress, 99); // Cap at 99%
            });
        }, 100);

        try {
            const result = await apiFunction(variables, sourceDocumentContent);
            if (!isMountedRef.current) return;
            clearProgressInterval();
            setProgress(100);
            setData(result);
            if (onSuccess) onSuccess(result);
            setTimeout(() => {
                if (isMountedRef.current) setLoading(false);
            }, 500); // Keep loading true for a moment to show 100%
        } catch (err) {
            if (!isMountedRef.current) return;
            clearProgressInterval();
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
            console.error(err);
            setProgress(0);
            setLoading(false); // Stop loading immediately on error
        }
    }, [apiFunction, clearProgressInterval]);

    return { mutate, data, loading, error, setData, progress, setError };
};