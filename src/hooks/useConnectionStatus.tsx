import { useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

interface ConnectionStatusHook {
  status: ConnectionStatus;
  isConnected: boolean;
  reconnect: () => void;
  lastConnected: Date | null;
}

export function useConnectionStatus(channel: RealtimeChannel | null): ConnectionStatusHook {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const attemptReconnect = useCallback(() => {
    if (!channel || reconnectAttempts >= 3) {
      if (reconnectAttempts >= 3) {
        console.warn('Max reconnection attempts reached, stopping reconnection');
      }
      return;
    }

    const delay = Math.min(2000 * Math.pow(2, reconnectAttempts), 10000);
    
    console.log(`Attempting reconnection in ${delay}ms (attempt ${reconnectAttempts + 1}/3)`);
    
    setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      setStatus('connecting');
    }, delay);
  }, [channel, reconnectAttempts]);

  useEffect(() => {
    if (!channel) {
      setStatus('disconnected');
      return;
    }

    const handleStatusChange = (newStatus: string) => {
      console.log('Connection status changed:', newStatus);
      
      switch (newStatus) {
        case 'SUBSCRIBED':
          setStatus('connected');
          setLastConnected(new Date());
          setReconnectAttempts(0);
          break;
        case 'SUBSCRIBING':
          setStatus('connecting');
          break;
        case 'CLOSED':
          // Only set disconnected, don't auto-reconnect to prevent loops
          setStatus('disconnected');
          break;
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
          setStatus('disconnected');
          attemptReconnect();
          break;
      }
    };

    channel.subscribe(handleStatusChange);

    return () => {
      // Cleanup handled by parent
    };
  }, [channel, attemptReconnect]);

  const reconnect = useCallback(() => {
    if (!channel) return;
    
    console.log('Manual reconnection triggered - page refresh recommended');
    setReconnectAttempts(0);
    // Just recommend refresh instead of trying to reconnect
    window.location.reload();
  }, [channel]);

  return {
    status,
    isConnected: status === 'connected',
    reconnect,
    lastConnected
  };
}
