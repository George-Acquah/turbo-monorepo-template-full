// workspace_profiles — enum values (single source for the /// @check constraints
// in profiles.prisma and for DTO validation).

export const TradingExperience = {
  NONE: 'none',
  LEARNING: 'learning',
  LOSING: 'losing',
  BREAKEVEN: 'breakeven',
  PROFITABLE: 'profitable',
} as const;

export type TradingExperience = (typeof TradingExperience)[keyof typeof TradingExperience];

export const ConsentKind = {
  TERMS_OF_SERVICE: 'TERMS_OF_SERVICE',
  PRIVACY_POLICY: 'PRIVACY_POLICY',
  MARKETING_EMAIL: 'MARKETING_EMAIL',
  RISK_DISCLAIMER: 'RISK_DISCLAIMER',
} as const;

export type ConsentKind = (typeof ConsentKind)[keyof typeof ConsentKind];
