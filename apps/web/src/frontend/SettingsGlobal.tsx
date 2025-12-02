import React, { createContext, useContext, useState, useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";

interface SettingsType {
  darkMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: number;
  userEmail: string;
  userName: string;

  setSettings: (values: Partial<SettingsType>) => void;
  saveSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  // Load settings from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem("userSettings");
    if (saved) {
      const parsed = JSON.parse(saved);
      setDarkMode(parsed.darkMode ?? false);
      setHighContrast(parsed.highContrast ?? false);
      setReducedMotion(parsed.reducedMotion ?? false);
      setFontSize(parsed.fontSize ?? 16);
      setUserEmail(parsed.userEmail ?? "");
      setUserName(parsed.userName ?? "");
    }
  }, []);

  // Save settings into localStorage
  const saveSettings = async () => {
    const settings = {
      darkMode,
      highContrast,
      reducedMotion,
      fontSize,
      userEmail,
      userName,
    };
    localStorage.setItem("userSettings", JSON.stringify(settings));
  };

  const setSettings = (values: Partial<SettingsType>) => {
    if (values.darkMode !== undefined) setDarkMode(values.darkMode);
    if (values.highContrast !== undefined) setHighContrast(values.highContrast);
    if (values.reducedMotion !== undefined) setReducedMotion(values.reducedMotion);
    if (values.fontSize !== undefined) setFontSize(values.fontSize);
    if (values.userEmail !== undefined) setUserEmail(values.userEmail);
    if (values.userName !== undefined) setUserName(values.userName);
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      ...(highContrast && {
        contrastThreshold: 7,
        primary: { main: "#000" },
        secondary: { main: "#444" },
        background: { default: darkMode ? "#000" : "#fff" },
        text: { primary: darkMode ? "#fff" : "#000" },
      }),
    },
    typography: { fontSize },
    transitions: {
      duration: reducedMotion
        ? { shortest: 0, shorter: 0, short: 0, standard: 0, complex: 0, enteringScreen: 0, leavingScreen: 0 }
        : undefined,
    },
  });

  return (
    <SettingsContext.Provider
      value={{
        darkMode,
        highContrast,
        reducedMotion,
        fontSize,
        userEmail,
        userName,
        setSettings,
        saveSettings,
      }}
    >
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
