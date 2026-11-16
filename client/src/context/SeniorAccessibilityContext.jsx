import React, { createContext, useContext, useState, useEffect } from 'react';

const SeniorAccessibilityContext = createContext();

export const SeniorAccessibilityProvider = ({ children }) => {
  const [isSeniorMode, setIsSeniorMode] = useState(() => {
    return localStorage.getItem('campusride_senior_mode') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isSeniorMode) {
      root.classList.add('senior-mode');
    } else {
      root.classList.remove('senior-mode');
    }
    localStorage.setItem('campusride_senior_mode', isSeniorMode);
  }, [isSeniorMode]);

  const toggleSeniorMode = () => {
    setIsSeniorMode(prev => !prev);
  };

  return (
    <SeniorAccessibilityContext.Provider value={{ isSeniorMode, toggleSeniorMode }}>
      {children}
    </SeniorAccessibilityContext.Provider>
  );
};

export const useSeniorAccessibility = () => useContext(SeniorAccessibilityContext);
