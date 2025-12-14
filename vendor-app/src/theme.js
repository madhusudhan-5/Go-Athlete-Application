export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const shape = {
  corner: 12,
  cornerSmall: 8,
  cornerLarge: 16,
  cornerFull: 9999,
};

export const elevation = {
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  level3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  level4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 12,
  },
  level5: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 16,
  },
};

export const typography = {
  display: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
  },
  headline: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
  },
  title: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  label: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  caption: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
  },
};

export const animations = {
  buttonPress: {
    scale: 0.97,
    duration: 100,
  },
  hover: {
    scale: 1.02,
    duration: 150,
  },
  fabSpring: {
    damping: 15,
    stiffness: 150,
  },
  fadeIn: {
    duration: 200,
  },
  slideUp: {
    duration: 250,
  },
  shimmer: {
    duration: 1200,
  },
};

export const colors = {
  primary: '#0A1F35',
  primaryLight: '#1A3A5C',
  primaryDark: '#051018',
  secondary: '#F4A261',
  secondaryLight: '#F9C784',
  secondaryDark: '#E76F51',
  accent: '#E9C46A',
  accentLight: '#F4E285',
  onPrimary: '#FFFFFF',
  onSecondary: '#0A1F35',
  onAccent: '#0A1F35',
  surface: '#FFFFFF',
  surfaceVariant: '#F8F9FA',
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#F8F9FA',
  surfaceContainerHigh: '#F1F3F5',
  background: '#F5F7FA',
  onSurface: '#0A1F35',
  onSurfaceVariant: '#4A5568',
  outline: '#95A5A6',
  outlineVariant: '#E2E8F0',
  error: '#D32F2F',
  onError: '#FFFFFF',
  success: '#2E7D32',
  successLight: '#81C784',
  warning: '#F4A261',
  warningLight: '#FFCC80',
  info: '#1976D2',
  severityLow: '#A1A1A1',
  severityMedium: '#F4A261',
  severityHigh: '#D32F2F',
  severityCritical: '#B71C1C',
  card: '#FFFFFF',
  cardHighlight: '#FEF9E7',
  cardSuccess: '#E8F5E9',
  cardWarning: '#FFF8E1',
  cardAccent: '#FCF3CF',
  divider: '#E2E8F0',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const getCommonStyles = (themeColors) => ({
  card: {
    backgroundColor: themeColors.surface,
    borderRadius: shape.cornerLarge,
    padding: spacing.lg,
    ...elevation.level1,
  },
  cardElevated: {
    backgroundColor: themeColors.surface,
    borderRadius: shape.cornerLarge,
    padding: spacing.lg,
    ...elevation.level2,
  },
  cardHighlight: {
    backgroundColor: themeColors.cardHighlight || '#FEF9E7',
    borderRadius: shape.cornerLarge,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: themeColors.accent || '#E9C46A',
  },
  button: {
    borderRadius: shape.corner,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: themeColors.primary,
  },
  buttonSecondary: {
    backgroundColor: themeColors.secondary,
  },
  buttonAccent: {
    backgroundColor: themeColors.accent,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: themeColors.primary,
  },
  buttonText: {
    ...typography.label,
    color: themeColors.onPrimary,
    fontWeight: '600',
  },
  buttonTextOutline: {
    ...typography.label,
    color: themeColors.primary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: themeColors.outline,
    borderRadius: shape.corner,
    padding: 14,
    ...typography.body,
    backgroundColor: themeColors.surface,
    color: themeColors.onSurface,
  },
  inputFilled: {
    backgroundColor: themeColors.surfaceVariant,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: themeColors.outline,
    borderRadius: 0,
    borderTopLeftRadius: shape.corner,
    borderTopRightRadius: shape.corner,
    padding: 14,
    ...typography.body,
    color: themeColors.onSurface,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: shape.cornerFull,
    backgroundColor: themeColors.surfaceVariant,
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  chipText: {
    ...typography.labelSmall,
    color: themeColors.onSurfaceVariant,
  },
  chipTextActive: {
    color: themeColors.onPrimary,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: shape.cornerFull,
    alignSelf: 'flex-start',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
  },
  badgeError: {
    backgroundColor: 'rgba(211, 47, 47, 0.12)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(244, 162, 97, 0.15)',
  },
  badgeNeutral: {
    backgroundColor: 'rgba(161, 161, 161, 0.12)',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: shape.corner,
    backgroundColor: themeColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.level3,
  },
  appBar: {
    backgroundColor: themeColors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.outlineVariant,
    ...elevation.level1,
  },
  appBarTitle: {
    ...typography.title,
    color: themeColors.onSurface,
  },
  skeleton: {
    backgroundColor: themeColors.surfaceContainerHigh || themeColors.background,
    borderRadius: shape.cornerSmall,
  },
  divider: {
    height: 1,
    backgroundColor: themeColors.divider || themeColors.outlineVariant,
    marginVertical: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.outlineVariant,
    gap: spacing.md,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  contentPadding: {
    padding: spacing.lg,
  },
  webCentered: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  kpiCard: {
    backgroundColor: themeColors.surface,
    borderRadius: shape.cornerLarge,
    padding: spacing.lg,
    ...elevation.level1,
    borderLeftWidth: 4,
  },
  kpiCardAccent: {
    borderLeftColor: themeColors.accent,
  },
  kpiCardSuccess: {
    borderLeftColor: themeColors.success,
  },
  kpiCardWarning: {
    borderLeftColor: themeColors.warning,
  },
  kpiCardPrimary: {
    borderLeftColor: themeColors.primary,
  },
});

export const commonStyles = getCommonStyles(colors);
