import { theme } from './Theme';

export default function StatCard({ label, value, sub, accent = false }) {
  return (
    <div
      style={{
        background: theme.glassThin.background,
        backdropFilter: theme.glassThin.backdropFilter,
        WebkitBackdropFilter: theme.glassThin.WebkitBackdropFilter,
        border: theme.glassThin.border,
        borderRadius: theme.radius.md,
        padding: `${theme.space.md}px ${theme.space.lg}px`,
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.body,
          ...theme.type.footnote,
          color: theme.colors.textSecondary,
          marginBottom: theme.space.xs,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: theme.fonts.display,
          fontSize: theme.type.title1.fontSize,
          fontWeight: theme.type.title1.fontWeight,
          letterSpacing: theme.type.title1.letterSpacing,
          color: accent ? theme.colors.accent : theme.colors.textPrimary,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: theme.fonts.body,
            ...theme.type.caption,
            color: theme.colors.textMuted,
            marginTop: theme.space.xs,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
