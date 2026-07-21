/**
 * This prototype uses regular CSS, not Tailwind CSS.
 * Keeping an explicit empty PostCSS configuration prevents a previously
 * generated Tailwind config from trying to load @tailwindcss/postcss.
 */
const config = {
  plugins: {},
};

export default config;
