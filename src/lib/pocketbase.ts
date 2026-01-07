import PocketBase from 'pocketbase';

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Helper to get full file URL
export const getPbImageUrl = (
    collectionId: string,
    recordId: string,
    fileName: string,
    thumb: string = '100x100' // default thumb size
) => {
    if (!fileName) return null;
    // If it's already a full URL (external), return it
    if (fileName.startsWith('http')) return fileName;

    return pb.files.getUrl({ collectionId, id: recordId }, fileName, { thumb });
};
