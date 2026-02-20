// Simplificação de sistema de toast para não precisar instalar bibliotecas
import { useState, useEffect } from 'react';

const listeners = [];
let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = { ...memoryState, toasts: [action.toast, ...memoryState.toasts] };
  listeners.forEach((listener) => listener(memoryState));
  
  // Remove automaticamente após 3 segundos
  setTimeout(() => {
    memoryState = { ...memoryState, toasts: memoryState.toasts.filter((t) => t.id !== action.toast.id) };
    listeners.forEach((listener) => listener(memoryState));
  }, 3000);
}

export function toast({ title, description, variant = "default" }) {
  const id = Math.random().toString(36).substring(2, 9);
  dispatch({ type: "ADD_TOAST", toast: { id, title, description, variant } });
}

export function useToast() {
  const [state, setState] = useState(memoryState);
  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, [state]);
  return state;
}