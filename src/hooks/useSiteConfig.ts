import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { toast } from "sonner";
import { ClientResponseError } from "pocketbase";

export function useSiteConfig<T>(key: string, defaultValue: T) {
    const [data, setData] = useState<T>(defaultValue);
    const [loading, setLoading] = useState(true);
    const [recordId, setRecordId] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            try {
                // Try to find the config record by key
                // We assume a collection 'site_config' exists with fields: key (text), value (json)
                const record = await pb.collection("site_config").getFirstListItem(`key="${key}"`);
                if (mounted) {
                    setData(record.value);
                    setRecordId(record.id);
                }
            } catch (e) {
                // If not found (404), we might need to create it later on save, or return default
                // If it's a real error (not 404), log it
                if ((e as ClientResponseError).status !== 404) {
                    console.error(`Error loading config for ${key}:`, e);
                }
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
                await pb.collection("site_config").update(recordId, {
                    value: newData,
                });
            } else {
                const record = await pb.collection("site_config").create({
                    key,
                    value: newData,
                });
                setRecordId(record.id);
            }
            setData(newData);
            // toast.success("Configuração salva!"); // Optional: caller can toast
        } catch (e) {
            console.error(`Error saving config for ${key}:`, e);
            toast.error("Erro ao salvar configuração.");
            throw e;
        }
    };

    return { data, loading, save, setData };
}
