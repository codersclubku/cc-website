export type FeedbackType = 'bug' | 'suggestion' | 'issue' | 'other';

export type FeedbackSeverity = 'Low' | 'Medium' | 'High';

export type FeedbackStatus = 'new' | 'in-review' | 'resolved' | 'rejected';

export interface FeedbackMeta {
  userAgent?: string;
  viewport?: string;
  theme?: string;
  route?: string;
  timestamp?: string;
}

export interface FeedbackRecord {
  id: string;
  referenceId: string;
  type: FeedbackType;
  title: string;
  description: string;
  category?: string | null;
  severity?: FeedbackSeverity | null;
  page?: string | null;
  stepsToReproduce?: string | null;
  screenshotUrl?: string | null;
  name?: string | null;
  email?: string | null;
  replyRequested: boolean;
  anonymous: boolean;
  meta: FeedbackMeta;
  status: FeedbackStatus;
  internalNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackSubmissionPayload {
  type: FeedbackType;
  title: string;
  description: string;
  category?: string;
  severity?: FeedbackSeverity;
  page?: string;
  stepsToReproduce?: string;
  screenshotUrl?: string;
  name?: string;
  email?: string;
  replyRequested?: boolean;
  anonymous?: boolean;
  meta?: FeedbackMeta;
  websiteUrl?: string;
}
