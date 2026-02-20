import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Função para juntar classes CSS (já tinha antes)
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Nova função que a página de Funcionários pede
export function createPageUrl(page) {
  const params = new URLSearchParams(window.location.search);
  params.set('page', page);
  return `?${params.toString()}`;
}