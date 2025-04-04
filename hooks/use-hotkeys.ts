"use client";

import { useEffect } from 'react';

type Hotkey = string;
type Callback = (e: KeyboardEvent) => void;

export function useHotkeys(hotkey: Hotkey, callback: Callback) {
  useEffect(() => {
    const keys = hotkey.toLowerCase().split('+');

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const metaKey = event.metaKey || event.ctrlKey;

      if (
        (keys.includes('meta') && !metaKey) ||
        (keys.includes('ctrl') && !event.ctrlKey) ||
        (keys.includes('shift') && !event.shiftKey) ||
        (keys.includes('alt') && !event.altKey)
      ) {
        return;
      }

      const mainKey = keys[keys.length - 1];
      if (key === mainKey) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hotkey, callback]);
}