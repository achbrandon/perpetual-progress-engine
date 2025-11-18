import { useCallback } from 'react';

export type NotificationSoundType = 'inheritance' | 'transaction' | 'security' | 'general';

const SOUND_FILES: Record<NotificationSoundType, string> = {
  inheritance: '/inheritance-alert.mp3',
  transaction: '/transaction-alert.mp3',
  security: '/security-alert.mp3',
  general: '/notification.mp3',
};

export const useNotificationSound = () => {
  const playSound = useCallback((type: NotificationSoundType = 'general') => {
    // Check if sounds are enabled
    const soundEnabled = localStorage.getItem('notification_sound_enabled');
    if (soundEnabled === 'false') return;

    // Get volume for specific alert type
    const volumeKey = `notification_volume_${type}`;
    const savedVolume = localStorage.getItem(volumeKey);
    const volume = savedVolume ? parseFloat(savedVolume) : 0.5;

    // Play the sound
    const audio = new Audio(SOUND_FILES[type]);
    audio.volume = volume;
    audio.play().catch(err => console.log(`Audio play failed for ${type}:`, err));
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
