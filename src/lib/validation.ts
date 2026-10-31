import { z } from 'zod';

const noHtmlRegex = /^[^<>]*$/;

export const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password123',
  'admin123',
  'qwertyuiop',
  'letmein123',
  'welcome123',
  'iloveyou',
  'kishkinda',
  'kishkinda123',
  'codersclub',
  'coders123',
  'student123',
  'university123'
]);

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.trim().toLowerCase());
}

export const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Artificial Intelligence & Data Science',
  'Artificial Intelligence & Machine Learning',
  'Information Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Master of Computer Applications',
  'Other'
] as const;

export const ACADEMIC_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year'
] as const;

export const SEMESTERS = [
  '1st Semester',
  '2nd Semester',
  '3rd Semester',
  '4th Semester',
  '5th Semester',
  '6th Semester',
  '7th Semester',
  '8th Semester'
] as const;

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(100),
  department: z.string().trim().min(2).max(60),
  year: z.string().trim().min(1).max(30),
  universityRegNo: z.string().trim().toUpperCase().min(3).max(30),
  consent: z.boolean(),
  websiteUrl: z.string().optional().or(z.literal(''))
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

export const USN_AUTHORITATIVE_REGEX = /^(KU[0-9]{4}[A-Z]{2,4}[0-9]{3}|[1-9][A-Z]{2}[0-9]{2}[A-Z]{2,4}[0-9]{3})$/;

export function normalizeUsn(rawUsn: string): string {
  return typeof rawUsn === 'string' ? rawUsn.trim().toUpperCase() : '';
}

export function isValidUsn(rawUsn: string): boolean {
  if (typeof rawUsn !== 'string') return false;
  const clean = normalizeUsn(rawUsn);
  return USN_AUTHORITATIVE_REGEX.test(clean);
}

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name cannot exceed 100 characters.')
    .regex(noHtmlRegex, 'HTML tags and angle brackets are not permitted.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.')
    .max(100, 'Email cannot exceed 100 characters.'),
  usn: z
    .string()
    .trim()
    .toUpperCase()
    .refine(isValidUsn, {
      message: 'USN must follow Kishkinda University format (e.g. KU2024CS001) or Karnataka VTU format (e.g. 2KA22CS001).'
    }),
  department: z
    .string()
    .min(1, 'Please select your department.'),
  year: z
    .string()
    .min(1, 'Please select your academic year.'),
  semester: z
    .string()
    .min(1, 'Please select your semester.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .refine((p) => !isCommonPassword(p), {
      message: 'This password is too easily guessed. Please choose a more unique password.'
    }),
  consent: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must review and accept the Privacy Notice to sign up.'
    }),
  websiteUrl: z.string().max(0, 'Bot submission rejected.').optional().or(z.literal(''))
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Please enter your password.')
});

export type SignInFormData = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.')
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .refine((p) => !isCommonPassword(p), {
      message: 'This password is too easily guessed. Please choose a more unique password.'
    })
});

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name cannot exceed 100 characters.')
    .regex(noHtmlRegex, 'HTML tags and angle brackets are not permitted.'),
  department: z
    .string()
    .min(1, 'Please select your department.'),
  year: z
    .string()
    .min(1, 'Please select your academic year.'),
  semester: z
    .string()
    .min(1, 'Please select your semester.')
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name cannot exceed 100 characters.')
    .regex(noHtmlRegex, 'HTML tags are not permitted.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.')
    .max(100, 'Email cannot exceed 100 characters.'),
  message: z
    .string()
    .trim()
    .min(5, 'Message must be at least 5 characters.')
    .max(2000, 'Message cannot exceed 2000 characters.')
    .regex(noHtmlRegex, 'HTML tags are not permitted.'),
  consent: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must consent to be contacted regarding this message.'
    }),
  websiteUrl: z.string().max(0, 'Bot submission rejected.').optional().or(z.literal(''))
});

export type ContactFormData = z.infer<typeof contactSchema>;

export function sanitizeExcelValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const raw = String(value);
  if (/^[=+\-@\t\r]/.test(raw)) {
    return "'" + raw;
  }
  const trimmed = raw.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return "'" + trimmed;
  }
  return trimmed;
}

