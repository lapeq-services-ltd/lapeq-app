export const lightTheme = {
    card: "#f7f4ee",
    cardFg: "#060606",
    primary: "#c9a84c",
    secondary: "#ede9e0",
    muted: "rgba(6,6,6,0.45)",
    border: "rgba(6,6,6,0.08)",
    black: "#060606",
    cream: "#f0ece4",
    green: "#22c55e",
    red: "#ef4444",
    background: "#f7f4ee",
    surface: "#ede9e0",
    text: "#060606",
};

export const darkTheme = {
    card: "#121212",
    cardFg: "#f0ece4",
    primary: "#c9a84c", // keep gold primary
    secondary: "#1e1e1e",
    muted: "rgba(240,236,228,0.45)",
    border: "rgba(240,236,228,0.1)",
    black: "#f0ece4", // invert semantic black to cream
    cream: "#060606", // invert semantic cream to black
    green: "#22c55e",
    red: "#ef4444",
    background: "#0a0a0a",
    surface: "#1a1a1a",
    text: "#f0ece4",
};

export type ThemeColors = typeof lightTheme;
