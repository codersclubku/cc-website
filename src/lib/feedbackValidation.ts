import { z } from 'zod';

const noAngleBrackets = /^[^<>]*$/;

export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .trim();
}

export const feedbackTypes = ['bug', 'suggestion', 'issue', 'other'] as const;
export const bugSeverities = ['Low', 'Medium', 'High'] as const;
export const suggestionCategories = ['Events', 'Workshops', 'Projects', 'Website', 'Other'] as const;
export const issueCategories = ['Event', 'Team', 'Club management', 'Other'] as const;

export const feedbackSubmissionSchema = z.object({
  type: z.enum(feedbackTypes),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(100, 'Title cannot exceed 100 characters.')
    .regex(noAngleBrackets, 'Angle brackets (< >) are not allowed.'),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters.')
    .max(2000, 'Description cannot exceed 2000 characters.')
    .regex(noAngleBrackets, 'Angle brackets (< >) are not allowed.'),
  page: z.string().trim().max(250).optional().or(z.literal('')),
  severity: z.enum(bugSeverities).optional(),
  stepsToReproduce: z.string().trim().max(2000).regex(noAngleBrackets, 'Angle brackets (< >) are not allowed.').optional().or(z.literal('')),
  screenshotUrl: z.string().optional().or(z.literal('')),
  category: z.string().trim().max(50).optional().or(z.literal('')),
  name: z.string().trim().max(100).regex(noAngleBrackets, 'Angle brackets (< >) are not allowed.').optional().or(z.literal('')),
  email: z.string().trim().max(100).optional().or(z.literal('')),
  replyRequested: z.boolean().default(false),
  anonymous: z.boolean().default(false),
  meta: z
    .object({
      userAgent: z.string().optional(),
      viewport: z.string().optional(),
      theme: z.string().optional(),
      route: z.string().optional(),
      timestamp: z.string().optional(),
    })
    .optional(),
  websiteUrl: z.string().max(0, 'Bot submission rejected.').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.type === 'bug') {
    if (!data.severity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Severity is required for bug reports.',
        path: ['severity'],
      });
    }
    if (!data.page || data.page.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page / URL is required for bug reports.',
        path: ['page'],
      });
    }
  }

  if (data.type === 'suggestion') {
    if (!data.category || !suggestionCategories.includes(data.category as any)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please choose a category for your suggestion.',
        path: ['category'],
      });
    }
  }

  if (data.type === 'issue') {
    if (!data.category || !issueCategories.includes(data.category as any)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select what this issue is related to.',
        path: ['category'],
      });
    }
  }

  if (data.replyRequested && !data.anonymous) {
    if (!data.email || data.email.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email address is required if you request a reply.',
        path: ['email'],
      });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please provide a valid email address.',
          path: ['email'],
        });
      }
    }
  }
});

export type FeedbackFormValidationInput = z.infer<typeof feedbackSubmissionSchema>;
