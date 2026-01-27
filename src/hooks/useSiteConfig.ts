import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useSiteConfig<T>(key: string, defaultValue: T) {
    const [data, setData] = useState<T>(defaultValue);
    const [loading, setLoading] = useState(true);
    const [recordId, setRecordId] = useState<string | null>(null);

    // Use ref to track the previous data for stable comparison
    const dataRef = useRef<T>(defaultValue);
    const keyRef = useRef(key);

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            try {
                // Try to find the config record by key in Supabase
                const { data: record, error } = await supabase
                    .from("site_config")
                    .select("*")
                    .eq("key", key)
                    .single();

                if (error) {
                    if (error.code !== "PGRST116") { // PGRST116 is 'no rows returned'
                        console.error(`Error loading config for ${key}:`, error);
                    }
                    // Keep default value when no record exists
                    if (mounted) {
                        setLoading(false);
                    }
                    return;
                }

                if (mounted && record) {
                    const newValue = record.value as T;
                    console.log(`[useSiteConfig] Loaded "${key}":`, newValue);
                    // Only update state if data actually changed (avoid re-renders)
                    const currentJSON = JSON.stringify(dataRef.current);
                    const newJSON = JSON.stringify(newValue);
                    if (currentJSON !== newJSON) {
                        dataRef.current = newValue;
                        setData(newValue);
                    }
                    setRecordId(record.id);
                }
            } catch (e) {
                console.error(`Unexpected error loading config for ${key}:`, e);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        // Reset if key changes
        if (keyRef.current !== key) {
            keyRef.current = key;
            dataRef.current = defaultValue;
            setData(defaultValue);
            setRecordId(null);
            setLoading(true);
        }

        loadData();

        return () => {
            mounted = false;
        };
    }, [key, defaultValue]);

    const save = useCallback(async (newData: T) => {
        console.log(`[useSiteConfig] Saving "${key}":`, newData);
        try {
            if (recordId) {
                const { error } = await supabase
                    .from("site_config")
                    .update({ value: newData })
                    .eq("id", recordId);

                if (error) throw error;
            } else {
                const { data: record, error } = await supabase
                    .from("site_config")
                    .insert({ key, value: newData })
                    .select()
                    .single();

                if (error) throw error;
                if (record) setRecordId(record.id);
            }
            dataRef.current = newData;
            setData(newData);
        } catch (e) {
            console.error(`Error saving config for ${key}:`, e);
            toast.error("Erro ao salvar configuração.");
            throw e;
        }
    }, [key, recordId]);

    // Stable setData wrapper that also updates ref
    const setDataStable = useCallback((newData: T | ((prev: T) => T)) => {
        setData((prev) => {
            const resolved = typeof newData === 'function' ? (newData as (prev: T) => T)(prev) : newData;
            dataRef.current = resolved;
            return resolved;
        });
    }, []);

    return { data, loading, save, setData: setDataStable };
}
