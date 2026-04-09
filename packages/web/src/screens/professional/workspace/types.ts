export type PortfolioEntryForm = {
  assetUrl: string;
  description: string;
  id?: string;
  sortOrder: string;
  title: string;
};

export type GalleryAssetForm = {
  assetUrl: string;
  caption: string;
  fileName: string;
  id?: string;
  sortOrder: string;
};

export type CredentialForm = {
  credentialCode: string;
  expiresAt: string;
  id?: string;
  issuedAt: string;
  issuer: string;
  label: string;
};

export type StoryForm = {
  body: string;
  id?: string;
  isPublished: boolean;
  sortOrder: string;
  title: string;
};

export type CoverageAreaForm = {
  areaLabel: string;
  city: string;
  id?: string;
};

export type AvailabilityRuleForm = {
  endTime: string;
  id?: string;
  isUnavailable: boolean;
  startTime: string;
  weekday: string;
};
