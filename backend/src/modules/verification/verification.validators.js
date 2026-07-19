import { z } from 'zod';

export const submitCredentialsSchema = z.object({
  body: z.object({
    yearsOfExperience: z.coerce.number().min(0).max(60).optional(),
    specializations: z.string().optional(),
    languagesSpoken: z.string().optional(),
    courtJurisdictions: z.string().optional(),
    bio: z.string().max(2000).optional(),
    education: z.string().optional(),
    serviceOfferings: z.string().optional(),
    availability: z.string().optional(),
  }),
});

export const approveVerificationSchema = z.object({
  body: z.object({
    notes: z.string().max(500).optional(),
  }),
});

export const rejectVerificationSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(1, 'Rejection reason is required')
      .max(500, 'Reason must be at most 500 characters'),
    notes: z.string().max(500).optional(),
  }),
});

export const requestMoreInfoSchema = z.object({
  body: z.object({
    notes: z
      .string()
      .min(1, 'Please specify what information is needed')
      .max(500, 'Notes must be at most 500 characters'),
  }),
});
