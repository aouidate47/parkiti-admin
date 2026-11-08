export const theme = {
colors: {
bg: '#000000',
bgPanel: 'rgba(28, 28, 30, 0.72)',
bgPanelAlt: 'rgba(255, 255, 255, 0.06)',
bgPanelSolid: '#1C1C1E',
border: 'rgba(255, 255, 255, 0.08)',
borderStrong: 'rgba(255, 255, 255, 0.16)',
accent: '#C0F01F',
accentDim: 'rgba(192, 240, 31, 0.15)',
accentGlow: 'rgba(192, 240, 31, 0.25)',
textPrimary: 'rgba(255, 255, 255, 0.92)',
textSecondary: 'rgba(235, 235, 245, 0.60)',
textMuted: 'rgba(235, 235, 245, 0.38)',
danger: '#FF453A',
warning: '#FF9F0A',
success: '#32D74B',
reserved: '#C0F01F',
unreserved: '#0A84FF',
heatLow: '#0A84FF',
heatHigh: '#FF453A',
},
fonts: {
display: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Inter', sans-serif",
body: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', 'Inter', sans-serif",
},

type: {
largeTitle: { fontSize: 30, fontWeight: 700, letterSpacing: '-0.01em' },
title1: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' },
title2: { fontSize: 18, fontWeight: 600 },
headline: { fontSize: 15, fontWeight: 600 },
body: { fontSize: 15, fontWeight: 400 },
subheadline: { fontSize: 13, fontWeight: 500 },
footnote: { fontSize: 12, fontWeight: 500 },
caption: { fontSize: 11, fontWeight: 500 },
},

glass: {
background: 'rgba(28, 28, 30, 0.72)',
backdropFilter: 'blur(24px) saturate(180%)',
WebkitBackdropFilter: 'blur(24px) saturate(180%)',
border: '1px solid rgba(255, 255, 255, 0.08)',
boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
},
glassThin: {
background: 'rgba(28, 28, 30, 0.45)',
backdropFilter: 'blur(16px) saturate(180%)',
WebkitBackdropFilter: 'blur(16px) saturate(180%)',
border: '1px solid rgba(255, 255, 255, 0.07)',
boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)',
},

// Rounded consistently across the whole UI — bigger radii read as "modern/soft"
radius: {
xs: '8px', // tiny chips, badges (e.g. "Reserved"/"Navigating" legend dots row)
sm: '12px', // small buttons, input fields
md: '18px', // stat cards (Guards online, Free/total spots, Total users, Active now)
lg: '24px', // side panels (Guards / Drivers panels), list rows on hover
xl: '28px', // main containers, modals
xxl: '32px', // hero/large surfaces if needed
pill: '999px', // marker number pills (66 27 39), filter toggles (All/Online/Offline), avatars
},

space: {
xs: 4,
sm: 8,
md: 12,
lg: 16,
xl: 20,
xxl: 24,
},
};
