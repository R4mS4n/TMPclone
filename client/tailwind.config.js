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
  daisyui: {
    themes: [
      {
        TMPlight: {
          "base-100": "oklch(100% 0 0)", // Color de fondo claro
          "base-200": "oklch(98% 0 0)",
          "base-300": "oklch(95% 0 0)",
          "base-content": "oklch(21% 0.006 285.885)", // Color de texto oscuro
          "primary": "oklch(63% 0.237 25.331)", // Color primario en tonos rojos
          "primary-content": "oklch(93% 0.034 272.788)", // Texto primario
          "secondary": "oklch(70% 0.01 56.259)",
          "secondary-content": "oklch(94% 0.028 342.258)",
          "accent": "oklch(70% 0.191 22.216)", // Tonalidad más intensa en rojo
          "accent-content": "oklch(38% 0.063 188.416)",
          "neutral": "oklch(14% 0.005 285.823)", // Fondo neutro
          "neutral-content": "oklch(92% 0.004 286.32)", // Color de texto neutro
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
        TMPdark: {
          "base-100": "oklch(14% 0 0)", // Fondo oscuro
          "base-200": "oklch(20% 0 0)",
          "base-300": "oklch(26% 0 0)",
          "base-content": "oklch(97% 0 0)", // Color de texto claro
          "primary": "oklch(63% 0.237 25.331)",
          "primary-content": "oklch(98% 0.003 247.858)",
          "secondary": "oklch(86% 0.005 56.366)",
          "secondary-content": "oklch(43% 0 0)",
          "accent": "oklch(70% 0.191 22.216)",
          "accent-content": "oklch(98% 0.002 247.839)",
          "neutral": "oklch(26% 0 0)",
          "neutral-content": "oklch(98% 0 0)",
          "info": "oklch(55% 0.027 264.364)",
          "info-content": "oklch(97% 0.014 254.604)",
          "success": "oklch(76% 0.177 163.223)",
          "success-content": "oklch(98% 0.018 155.826)",
          "warning": "oklch(76% 0.188 70.08)",
          "warning-content": "oklch(98% 0.016 73.684)",
          "error": "oklch(71% 0.194 13.428)",
          "error-content": "oklch(97% 0.013 17.38)",
        },
      },
    ],
  },
  darkMode: 'class', // Asegúrate de que esta línea esté presente para activar el modo oscuro
};
