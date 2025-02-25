"use client";

import { useEffect, ReactNode } from 'react';
import { wsService } from '@/lib/services/websocket';
import { useAuthContext } from './auth-provider';

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated) {
      wsService.connect();
    } else {
      wsService.disconnect();
    }

    return () => {
      wsService.disconnect();
    };
  }, [isAuthenticated]);

  return <>{children}</>;
} 