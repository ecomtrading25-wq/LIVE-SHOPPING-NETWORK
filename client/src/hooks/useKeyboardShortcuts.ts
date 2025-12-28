import { useEffect } from 'react';

type ShortcutHandler = () => void;

interface Shortcuts {
  [key: string]: ShortcutHandler;
}

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      
      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
}
