// src/components/ui/UploadSection.tsx
"use client";

import React, { useState, useCallback } from 'react';
import { UploadCloud, File as FileIcon, Image as ImageIcon, Music, Video } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { saveMediaFile } from '@/utils/storage'; // Usando IndexedDB util com progresso

// Props definition, assuming it will receive callbacks to update parent state
interface UploadSectionProps {
  setMediaUrl: (url: string) => void;
  setMediaType: (type: 'image' | 'audio' | 'video') => void;
  setMediaTitle: (title: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function UploadSection({ setMediaUrl, setMediaType, setMediaTitle }: UploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;

    const type = file.type.startsWith('image/') ? 'image' :
                 file.type.startsWith('audio/') ? 'audio' : 'video';

    setCurrentFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    setIsProcessing(true);

    try {
      console.log(`Starting upload of ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      // Simulate progress for small files for better UX
      if (file.size < 5 * 1024 * 1024) { // Less than 5MB
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = Math.min(prev + 10, 90);
            if (newProgress >= 90) clearInterval(interval);
            return newProgress;
          });
        }, 100);
      }

      const fileId = await saveMediaFile(file, (progress) => {
        setUploadProgress(progress);
      });

      setMediaUrl(fileId);
      setMediaType(type);
      setMediaTitle(file.name.replace(/\.[^/.]+$/, ""));
      setUploadProgress(100);

      console.log(`Upload complete: ${file.name}`);
      toast.success(`${file.name} uploaded successfully!`);
    } catch (error) {
      console.error('Detailed error:', error);
      toast.error(`Failed to upload ${file.name}. Please try again.`);
      setUploadProgress(0);
    } finally {
      // Short delay to allow the user to see the "100%" state
      setTimeout(() => {
        setIsUploading(false);
        setIsProcessing(false);
        setCurrentFile(null);
        setUploadProgress(0);
      }, 1500);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    multiple: false,
  });

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-300 ${
          isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <UploadCloud className="w-12 h-12 text-gray-400" />
          <p className="text-lg font-semibold text-gray-700">
            {isDragActive ? 'Drop the file here...' : "Drag 'n' drop a file here, or click to select"}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports Images, Audio, and Video
          </p>
        </div>
      </div>

      {isUploading && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="truncate pr-4">{currentFile?.name || 'Processing...'}</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          {currentFile && (
            <p className="text-xs text-muted-foreground text-right">
              {formatFileSize((uploadProgress / 100) * currentFile.size)} of {formatFileSize(currentFile.size)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
