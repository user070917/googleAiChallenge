'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { addDocument, addCard, isLiveMode } from '@/lib/db';

export type FileStatus = 'queued' | 'analyzing' | 'completed' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  message: string;
}

export interface NotificationItem {
  id: string;
  message: string;
  type: 'success' | 'error';
  timestamp: string;
  read: boolean;
}

interface UploadContextType {
  uploads: UploadItem[];
  notifications: NotificationItem[];
  isProcessing: boolean;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  startUploads: () => Promise<void>;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string) => void;
  retryUpload: (id: string) => void;
  retryAllFailed: () => void;
  addNotification: (message: string, type: 'success' | 'error') => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const uploadsRef = useRef<UploadItem[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  // Sync ref with state
  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Load notifications from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_sasoo_notifications');
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse notifications', e);
        }
      }
    }
  }, []);

  // Save notifications to LocalStorage when changed
  const saveNotifications = (items: NotificationItem[]) => {
    setNotifications(items);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_sasoo_notifications', JSON.stringify(items));
    }
  };

  const addFiles = (files: File[]) => {
    const newItems = files.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      status: 'queued' as FileStatus,
      progress: 0,
      message: '대기 중 (Queued)'
    }));
    setUploads(prev => [...prev, ...newItems]);
  };

  const removeFile = (id: string) => {
    setUploads(prev => prev.filter(item => item.id !== id));
  };

  const updateUploadStatus = (id: string, status: FileStatus, progress: number, message: string) => {
    setUploads(prev => prev.map(item => item.id === id ? { ...item, status, progress, message } : item));
  };

  const addNotification = (message: string, type: 'success' | 'error') => {
    const newNotification: NotificationItem = {
      id: Math.random().toString(36).substring(2, 11),
      message,
      type,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    
    // Add to the top of notifications
    const updated = [newNotification, ...notifications];
    // Limit to 20 notifications in history
    if (updated.length > 20) {
      updated.pop();
    }
    saveNotifications(updated);
  };

  const startUploads = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    const live = isLiveMode();

    while (true) {
      // Find the first queued file using ref to avoid closure issues
      const item = uploadsRef.current.find(u => u.status === 'queued');
      if (!item) break;

      updateUploadStatus(item.id, 'analyzing', 15, '파일 원문 추출 중...');
      await new Promise(r => setTimeout(r, 600));
      updateUploadStatus(item.id, 'analyzing', 45, 'AI 맥락 분석 중...');

      try {
        const formData = new FormData();
        formData.append('file', item.file);

        const res = await fetch('/api/analyze', {
          method: 'POST',
          body: formData
        });

        const result = await res.json();
        
        updateUploadStatus(item.id, 'analyzing', 85, 'DB 저장 중...');
        await new Promise(r => setTimeout(r, 400));

        if (res.ok && result.success) {
          const data = result.data;
          
          if (!live) {
            const doc = await addDocument(
              data.file_name,
              data.source_type,
              data.raw_content || `[Simulated Content for ${data.file_name}]\nThis content was parsed locally.`,
              data.doc_id
            );
            await addCard({
              project: data.project,
              client: data.client,
              event_date: data.event_date,
              summary: data.summary,
              source_type: data.source_type,
              doc_id: doc.id
            });
          }

          updateUploadStatus(item.id, 'completed', 100, '분석 및 저장 완료');
          addNotification(`파일 '${item.file.name}' 분석 및 저장이 완료되었습니다.`, 'success');
        } else {
          throw new Error(result.error || '분석 실패');
        }
      } catch (err: unknown) {
        const errMsg = (err as Error).message || '오류 발생';
        updateUploadStatus(item.id, 'error', 0, errMsg);
        addNotification(`파일 '${item.file.name}' 분석 중 오류 발생: ${errMsg}`, 'error');
      }

      // Wait a tiny bit between uploads
      await new Promise(r => setTimeout(r, 300));
    }

    setIsProcessing(false);
    isProcessingRef.current = false;
  };

  const clearNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
  };

  const retryUpload = (id: string) => {
    setUploads(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: 'queued' as FileStatus, progress: 0, message: '대기 중 (Queued)' } 
        : item
    ));
    setTimeout(() => {
      startUploads();
    }, 50);
  };

  const retryAllFailed = () => {
    setUploads(prev => prev.map(item => 
      item.status === 'error'
        ? { ...item, status: 'queued' as FileStatus, progress: 0, message: '대기 중 (Queued)' } 
        : item
    ));
    setTimeout(() => {
      startUploads();
    }, 50);
  };

  return (
    <UploadContext.Provider value={{
      uploads,
      notifications,
      isProcessing,
      addFiles,
      removeFile,
      startUploads,
      clearNotification,
      clearAllNotifications,
      markAsRead,
      retryUpload,
      retryAllFailed,
      addNotification
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUploads() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUploads must be used within an UploadProvider');
  }
  return context;
}
