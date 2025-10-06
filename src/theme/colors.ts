/**
 * Theme Color Definitions
 * All colors are defined as RGB values for use with Tailwind's opacity modifier
 * Usage: bg-background/50 (50% opacity)
 */

export const lightTheme = {
  // Backgrounds
  background: '255 255 255',        // #ffffff - Main background
  foreground: '17 24 39',           // #111827 - Main text
  card: '249 250 251',              // #f9fafb - Card background
  'card-hover': '243 244 246',      // #f3f4f6 - Card hover state
  popover: '255 255 255',           // #ffffff - Popover background
  
  // Borders & Dividers
  border: '229 231 235',            // #e5e7eb - Default border
  'border-hover': '209 213 219',    // #d1d5db - Border hover
  input: '229 231 235',             // #e5e7eb - Input border
  ring: '59 130 246',               // #3b82f6 - Focus ring
  
  // Primary (Blue)
  primary: {
    DEFAULT: '33 150 243',          // #2196f3
    hover: '30 136 229',            // #1e88e5
    active: '25 118 210',           // #1976d2
    foreground: '255 255 255',      // #ffffff - Text on primary
  },
  
  // Secondary (Gray)
  secondary: {
    DEFAULT: '107 114 128',         // #6b7280
    hover: '75 85 99',              // #4b5563
    active: '55 65 81',             // #374151
    foreground: '255 255 255',      // #ffffff
  },
  
  // Muted (Light gray for subtle elements)
  muted: {
    DEFAULT: '243 244 246',         // #f3f4f6 - Background
    hover: '229 231 235',           // #e5e7eb
    foreground: '107 114 128',      // #6b7280 - Text
  },
  
  // Accent (Orange)
  accent: {
    DEFAULT: '255 152 0',           // #ff9800
    hover: '251 140 0',             // #fb8c00
    active: '245 124 0',            // #f57c00
    foreground: '255 255 255',      // #ffffff
  },
  
  // Semantic Colors
  success: {
    DEFAULT: '76 175 80',           // #4caf50
    hover: '67 160 71',             // #43a047
    foreground: '255 255 255',      // #ffffff
    background: '232 245 233',      // #e8f5e9
  },
  
  warning: {
    DEFAULT: '255 193 7',           // #ffc107
    hover: '255 179 0',             // #ffb300
    foreground: '55 65 81',         // #374151
    background: '255 248 225',      // #fff8e1
  },
  
  error: {
    DEFAULT: '244 67 54',           // #f44336
    hover: '229 57 53',             // #e53935
    foreground: '255 255 255',      // #ffffff
    background: '255 235 238',      // #ffebee
  },
  
  info: {
    DEFAULT: '3 169 244',           // #03a9f4
    hover: '2 136 209',             // #0288d1
    foreground: '255 255 255',      // #ffffff
    background: '225 245 254',      // #e1f5fe
  },
  
  // Sidebar
  sidebar: {
    DEFAULT: '255 255 255',         // #ffffff
    foreground: '55 65 81',         // #374151
    border: '229 231 235',          // #e5e7eb
    active: '239 246 255',          // #eff6ff
    'active-foreground': '30 64 175', // #1e40af
  },
};

// Dark Theme - Slate Variant (Default)
export const darkThemeSlate = {
  // Backgrounds
  background: '15 23 42',           // #0f172a - Main background (slate-900)
  foreground: '241 245 249',        // #f1f5f9 - Main text (slate-100)
  card: '30 41 59',                 // #1e293b - Card background (slate-800)
  'card-hover': '51 65 85',         // #334155 - Card hover (slate-700)
  popover: '30 41 59',              // #1e293b - Popover background
  
  // Borders & Dividers
  border: '51 65 85',               // #334155 - Default border (slate-700)
  'border-hover': '71 85 105',      // #475569 - Border hover (slate-600)
  input: '51 65 85',                // #334155 - Input border
  ring: '96 165 250',               // #60a5fa - Focus ring (lighter blue)
  
  // Primary (Lighter Blue for dark mode)
  primary: {
    DEFAULT: '59 130 246',          // #3b82f6
    hover: '96 165 250',            // #60a5fa
    active: '147 197 253',          // #93c5fd
    foreground: '15 23 42',         // #0f172a - Dark text on primary
  },
  
  // Secondary
  secondary: {
    DEFAULT: '148 163 184',         // #94a3b8 - slate-400
    hover: '203 213 225',           // #cbd5e1 - slate-300
    active: '226 232 240',          // #e2e8f0 - slate-200
    foreground: '15 23 42',         // #0f172a
  },
  
  // Muted
  muted: {
    DEFAULT: '51 65 85',            // #334155 - slate-700
    hover: '71 85 105',             // #475569 - slate-600
    foreground: '203 213 225',      // #cbd5e1 - slate-300
  },
  
  // Accent
  accent: {
    DEFAULT: '251 146 60',          // #fb923c - orange-400
    hover: '253 186 116',           // #fdba74 - orange-300
    active: '254 215 170',          // #fed7aa - orange-200
    foreground: '15 23 42',         // #0f172a
  },
  
  // Semantic Colors (adjusted for dark mode)
  success: {
    DEFAULT: '74 222 128',          // #4ade80 - green-400
    hover: '134 239 172',           // #86efac - green-300
    foreground: '15 23 42',         // #0f172a
    background: '20 83 45',         // #14532d - green-950
  },
  
  warning: {
    DEFAULT: '250 204 21',          // #facc15 - yellow-400
    hover: '253 224 71',            // #fde047 - yellow-300
    foreground: '15 23 42',         // #0f172a
    background: '66 32 6',          // #422006 - yellow-950
  },
  
  error: {
    DEFAULT: '248 113 113',         // #f87171 - red-400
    hover: '252 165 165',           // #fca5a5 - red-300
    foreground: '15 23 42',         // #0f172a
    background: '69 10 10',         // #450a0a - red-950
  },
  
  info: {
    DEFAULT: '56 189 248',          // #38bdf8 - sky-400
    hover: '125 211 252',           // #7dd3fc - sky-300
    foreground: '15 23 42',         // #0f172a
    background: '8 47 73',          // #082f49 - sky-950
  },
  
  // Sidebar
  sidebar: {
    DEFAULT: '30 41 59',            // #1e293b - slate-800
    foreground: '226 232 240',      // #e2e8f0 - slate-200
    border: '51 65 85',             // #334155 - slate-700
    active: '51 65 85',             // #334155 - slate-700
    'active-foreground': '147 197 253', // #93c5fd - blue-300
  },
};

// Dark Theme - Navy Variant (Deep Blue)
export const darkThemeNavy = {
  ...darkThemeSlate,
  background: '7 18 43',            // #07122b - Deep navy
  foreground: '241 245 249',        // #f1f5f9
  card: '17 33 66',                 // #112142 - Navy card
  'card-hover': '28 48 89',         // #1c3059 - Navy hover
  popover: '17 33 66',              // #112142
  border: '37 58 102',              // #253a66 - Navy border
  'border-hover': '48 73 128',      // #304980
  sidebar: {
    DEFAULT: '17 33 66',            // #112142
    foreground: '226 232 240',      // #e2e8f0
    border: '37 58 102',            // #253a66
    active: '37 58 102',            // #253a66
    'active-foreground': '147 197 253',
  },
};

// Dark Theme - True Black Variant (OLED friendly)
export const darkThemeTrueBlack = {
  ...darkThemeSlate,
  background: '0 0 0',              // #000000 - True black
  foreground: '250 250 250',        // #fafafa
  card: '23 23 23',                 // #171717 - Almost black
  'card-hover': '38 38 38',         // #262626
  popover: '23 23 23',              // #171717
  border: '38 38 38',               // #262626
  'border-hover': '64 64 64',       // #404040
  sidebar: {
    DEFAULT: '23 23 23',            // #171717
    foreground: '245 245 245',      // #f5f5f5
    border: '38 38 38',             // #262626
    active: '38 38 38',             // #262626
    'active-foreground': '147 197 253',
  },
};

export type ThemeColors = typeof lightTheme;



