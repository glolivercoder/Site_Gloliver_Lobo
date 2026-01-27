import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useSiteConfig<T>(key: string, defaultValue: T) {
    const [data, setData] = useState<T>(defaultValue);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            try {
                const { data: record, error } = await supabase
                    .from("site_config")
                    .select("value")
                    .eq("key", key)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is Row not found
                    console.error(`Error loading config for ${key}:`, error);
                }

                if (mounted && record) {
                    setData(record.value);
                }
            } catch (e) {
                console.error(`Unexpected error loading ${key}:`, e);
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
            const { error } = await supabase
                .from("site_config")
                .upsert({
                    key,
                    value: newData
                }, { onConflict: 'key' });

            if (error) throw error;

            setData(newData);
            // toast.success("Configuração salva!"); 
        } catch (e) {
            console.error(`Error saving config for ${key}:`, e);
            toast.error("Erro ao salvar configuração.");
            throw e;
        }
    };

    return { data, loading, save, setData };
}
