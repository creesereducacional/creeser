import React, { createContext, useContext, useState } from 'react';

const PortalLayoutContext = createContext({
  title: 'Portal Acadêmico',
  setTitle: () => {},
});

export function PortalLayoutProvider({ children }) {
  const [title, setTitle] = useState('Portal Acadêmico');

  return (
    <PortalLayoutContext.Provider value={{ title, setTitle }}>
      {children}
    </PortalLayoutContext.Provider>
  );
}

export function usePortalLayout() {
  return useContext(PortalLayoutContext);
}
