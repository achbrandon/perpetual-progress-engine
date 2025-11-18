import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type NotificationSoundType = 'inheritance' | 'transaction' | 'security' | 'general';

export const SOUND_OPTIONS: Record<NotificationSoundType, { value: string; label: string; file: string }[]> = {
  inheritance: [
    { value: 'inheritance-alert-1', label: 'Alert Sound 1', file: '/sounds/inheritance-alert-1.mp3' },
    { value: 'inheritance-alert-2', label: 'Alert Sound 2', file: '/sounds/inheritance-alert-2.mp3' },
    { value: 'inheritance-alert-3', label: 'Alert Sound 3', file: '/sounds/inheritance-alert-3.mp3' },
  ],
  transaction: [
    { value: 'transaction-alert-1', label: 'Chime 1', file: '/sounds/transaction-alert-1.mp3' },
    { value: 'transaction-alert-2', label: 'Chime 2', file: '/sounds/transaction-alert-2.mp3' },
    { value: 'transaction-alert-3', label: 'Chime 3', file: '/sounds/transaction-alert-3.mp3' },
  ],
  security: [
    { value: 'security-alert-1', label: 'Warning 1', file: '/sounds/security-alert-1.mp3' },
    { value: 'security-alert-2', label: 'Warning 2', file: '/sounds/security-alert-2.mp3' },
    { value: 'security-alert-3', label: 'Warning 3', file: '/sounds/security-alert-3.mp3' },
  ],
  general: [
    { value: 'general-alert-1', label: 'Notification 1', file: '/sounds/general-alert-1.mp3' },
    { value: 'general-alert-2', label: 'Notification 2', file: '/sounds/general-alert-2.mp3' },
    { value: 'notification', label: 'Classic', file: '/notification.mp3' },
  ],
};

export const getSoundFile = (type: NotificationSoundType, soundId: string): string => {
  const option = SOUND_OPTIONS[type].find(opt => opt.value === soundId);
  return option?.file || SOUND_OPTIONS[type][0].file;
};

export const useNotificationSound = () => {
  const playSound = useCallback(async (type: NotificationSoundType = 'general') => {
    // Check if sounds are enabled
    const soundEnabled = localStorage.getItem('notification_sound_enabled');
    if (soundEnabled === 'false') return;

    try {
      // Get user's selected sound from database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select(`sound_${type}`)
        .eq('id', user.id)
        .single();

      const soundId = profile?.[`sound_${type}`] || `${type}-alert-1`;
      const soundFile = getSoundFile(type, soundId);

      // Get volume for specific alert type
      const volumeKey = `notification_volume_${type}`;
      const savedVolume = localStorage.getItem(volumeKey);
      const volume = savedVolume ? parseFloat(savedVolume) : 0.5;

      // Play the sound
      const audio = new Audio(soundFile);
      audio.volume = volume;
      audio.play().catch(err => console.log(`Audio play failed for ${type}:`, err));
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, []);

  return { playSound };
};

export const getNotificationVolume = (type: NotificationSoundType): number => {
  const volumeKey = `notification_volume_${type}`;
  const saved = localStorage.getItem(volumeKey);
  return saved !== null ? parseFloat(saved) : 0.5;
};

export const setNotificationVolume = (type: NotificationSoundType, volume: number): void => {
  const volumeKey = `notification_volume_${type}`;
  localStorage.setItem(volumeKey, volume.toString());
};
