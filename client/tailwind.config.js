import daisyui from "daisyui";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  darkMode: "class",  
  daisyui: {
    themes: [
      {
        TMPlight: {
          "base-100": "oklch(100% 0 0)",
          "base-200": "oklch(98% 0 0)",
          "base-300": "oklch(95% 0 0)",
          "base-content": "oklch(21% 0.006 285.885)",
          "primary": "oklch(63% 0.237 25.331)",
          "primary-content": "oklch(93% 0.034 272.788)",
          "secondary": "oklch(70% 0.01 56.259)",
          "secondary-content": "oklch(94% 0.028 342.258)",
          "accent": "oklch(70% 0.191 22.216)",
          "accent-content": "oklch(38% 0.063 188.416)",
          "neutral": "oklch(14% 0.005 285.823)",
          "neutral-content": "oklch(92% 0.004 286.32)",
          "info": "oklch(70% 0.022 261.325)",
          "info-content": "oklch(98% 0.003 247.858)",
          "success": "oklch(76% 0.177 163.223)",
          "success-content": "oklch(37% 0.077 168.94)",
          "warning": "oklch(82% 0.189 84.429)",
          "warning-content": "oklch(41% 0.112 45.904)",
          "error": "oklch(71% 0.194 13.428)",
          "error-content": "oklch(27% 0.105 12.094)",
        },
      },
      {
        TMPdark:{
          "base-100": "oklch(10% 0 0)",
        "base-content": "oklch(95% 0.03 285)",
        "primary": "oklch(63% 0.237 25.331)",  // same red as light
        "primary-content": "oklch(95% 0.02 85)",
        "error": "oklch(71% 0.194 13.428)",
        "error-content": "oklch(27% 0.105 12.094)",
        },
      },
    ],
  },
};