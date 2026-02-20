import React from 'react'

export function useAccessControl() {
  // Configurações básicas
  const basePermissions = {
    role: 'ADMIN',
    isAdmin: true,
    canWrite: true,
    canDelete: true,
  };

  // O TRUQUE MÁGICO (Proxy):
  // Se o código pedir "canModifyUnit", "canFly", "canDance"...
  // Este código intercepta e responde "TRUE" (Sim) automaticamente.
  return new Proxy(basePermissions, {
    get: (target, prop) => {
      // Se a propriedade já existe (ex: isAdmin), retorna ela
      if (prop in target) return target[prop];
      
      // Se for uma função (começa com can...), retorna uma função que diz SIM
      return () => true;
    }
  });
}

export function ProtectedPage({ children }) {
  return <>{children}</>
}