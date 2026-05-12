import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username lazima iwe na herufi 3+'),
  password: z.string().min(6, 'Password lazima iwe na herufi 6+'),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username lazima iwe na herufi 3+')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username: herufi, namba na _ tu'),
    email: z.string().email('Email si sahihi'),
    password: z
      .string()
      .min(8, 'Password lazima iwe na herufi 8+')
      .regex(/[A-Z]/, 'Password lazima iwe na herufi kubwa moja')
      .regex(/[0-9]/, 'Password lazima iwe na namba moja')
      .regex(/[^A-Za-z0-9]/, 'Password lazima iwe na alama moja (kama !@#)')
      .refine((val) => !/^\d+$/.test(val), 'Password isiyokuwa namba tu'),
    confirm_password: z.string(),
    role: z.enum(['TOURIST', 'LOCAL_GUIDE']),
    bio: z.string().optional(),
    location: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords hazilingani',
    path: ['confirm_password'],
  });

export const forgotPasswordSchema = z.object({
  email_or_phone: z.string().min(1, 'Email au namba ya simu inahitajika'),
  username: z.string().min(3, 'Username lazima iwe na herufi 3+'),
});

export const resetPasswordSchema = z.object({
  email_or_phone: z.string().min(1, 'Email au namba ya simu inahitajika'),
  otp: z.string().length(6, 'OTP lazima iwe na namba 6'),
  new_password: z.string().min(8, 'Password lazima iwe na herufi 8+'),
});

export const createTipSchema = z.object({
  title: z.string().min(5, 'Kichwa kinahitajika (herufi 5+)'),
  description: z.string().min(20, 'Maelezo (herufi 20+)'),
  category: z.enum([
    'SAFETY',
    'LIFESTYLE',
    'NAVIGATION',
    'EXPERIENCE',
    'ACCESSIBILITY',
  ]),
  sub_topics: z.array(z.string()).min(1, 'Ongeza tag moja angalau'),
  location_address: z.string().optional(),
});

export const createSOSSchema = z.object({
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  message: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateTipInput = z.infer<typeof createTipSchema>;
export type CreateSOSInput = z.infer<typeof createSOSSchema>;