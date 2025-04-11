import React, { useRef, useCallback } from 'react';

export interface NotificationSoundProps {
  volume?: number;
}

/**
 * Componente que gera um som de notificação
 * Pode ser usado para reproduzir sons de notificação sem necessidade de arquivos de áudio externos
 */
export const NotificationSound: React.FC<NotificationSoundProps> = ({ volume = 0.5 }) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotification = useCallback(() => {
    try {
      // Criar contexto de áudio se ainda não existe
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Configurar o oscilador (gerador de som)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1500, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(500, context.currentTime + 0.2);

      // Configurar o volume
      gainNode.gain.setValueAtTime(volume, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

      // Conectar os nós
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Tocar o som
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.3);

    } catch (error) {
      console.error('Erro ao reproduzir notificação:', error);
    }
  }, [volume]);

  return (
    <button 
      className="hidden" 
      onClick={playNotification} 
      aria-label="Reproduzir som de notificação"
    />
  );
};

// Função utilitária para tocar o som programaticamente
export function playNotificationSound(volume = 0.5) {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1500, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(500, context.currentTime + 0.2);

    gainNode.gain.setValueAtTime(volume, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
  } catch (error) {
    console.error('Erro ao reproduzir notificação:', error);
  }
}

export default NotificationSound;