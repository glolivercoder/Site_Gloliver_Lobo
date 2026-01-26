import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useSiteConfig<T>(key: string, defaultValue: T) {
    const [data, setData] = useState<T>(defaultValue);
    const [loading, setLoading] = useState(true);
    const [recordId, setRecordId] = useState<string | null>(null);

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
                    return;
                }

                if (mounted && record) {
                    setData(record.value as T);
                    setRecordId(record.id);
                }
            } catch (e) {
                console.error(`Unexpected error loading config for ${key}:`, e);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, [key]);

    const save = async (newData: T) => {
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
            setData(newData);
        } catch (e) {
            console.error(`Error saving config for ${key}:`, e);
            toast.error("Erro ao salvar configuração.");
            throw e;
        }
    };

    return { data, loading, save, setData };
}
