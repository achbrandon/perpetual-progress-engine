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
    if (!channel || reconnectAttempts >= 5) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    
    console.log(`Attempting reconnection in ${delay}ms (attempt ${reconnectAttempts + 1}/5)`);
    
    setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      setStatus('connecting');
      
      channel.unsubscribe().then(() => {
        channel.subscribe((status) => {
          console.log('Reconnection status:', status);
        });
      });
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
    
    console.log('Manual reconnection triggered');
    setReconnectAttempts(0);
    setStatus('connecting');
    
    channel.unsubscribe().then(() => {
      channel.subscribe((status) => {
        console.log('Manual reconnection status:', status);
      });
    });
  }, [channel]);

  return {
    status,
    isConnected: status === 'connected',
    reconnect,
    lastConnected
  };
}
