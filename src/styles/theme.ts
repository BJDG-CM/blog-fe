export const theme = {
  colors: {
    background: "#f8f6f3",
    text: "#1f1f1f",
    accent: "#c05f3c",
    muted: "#6e6a66",
    card: "#ffffff",
    border: "#e5e0da",
  },
  fonts: {
    body: "Inter, system-ui, -apple-system, sans-serif",
    heading: "Source Serif 4, Georgia, serif",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "40px",
    xxl: "64px",
  },
  radius: {
    sm: "8px",
    md: "16px",
    pill: "999px",
  },
};

export type Theme = typeof theme;
