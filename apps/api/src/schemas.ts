import { z } from 'zod';
import { CURRENCIES } from './env.js';

const compareAt = z.number().int().min(0).max(100_000_000).nullable();

export const productWriteSchema = z
  .object({
    name: z.string().trim().min(2, 'El nombre es muy corto').max(120),
    summary: z.string().trim().max(200).optional().default(''),
    description: z.string().trim().max(5000).optional().default(''),
    priceCents: z.number().int().min(0, 'El precio no puede ser negativo').max(100_000_000),
    compareAtCents: compareAt.optional().default(null),
    sku: z.string().trim().max(60).optional().default(''),
    stock: z.number().int().min(0).max(1_000_000),
    sectionId: z.string().uuid().nullable().optional().default(null),
    published: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.compareAtCents !== null && value.compareAtCents <= value.priceCents) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El precio anterior tiene que ser mayor al precio',
        path: ['compareAtCents'],
      });
    }
  });

export const productPatchSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es muy corto').max(120).optional(),
  summary: z.string().trim().max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  priceCents: z.number().int().min(0, 'El precio no puede ser negativo').max(100_000_000).optional(),
  compareAtCents: compareAt.optional(),
  sku: z.string().trim().max(60).optional(),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  sectionId: z.string().uuid().nullable().optional(),
  published: z.boolean().optional(),
});

export const sectionWriteSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es muy corto').max(60),
  description: z.string().trim().max(300).optional().default(''),
  visible: z.boolean().optional().default(true),
});

export const sectionPatchSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es muy corto').max(60).optional(),
  description: z.string().trim().max(300).optional(),
  visible: z.boolean().optional(),
});

export const settingsSchema = z.object({
  storeName: z.string().trim().min(2, 'El nombre de la tienda es muy corto').max(60),
  tagline: z.string().trim().max(160),
  location: z.string().trim().max(180),
  currency: z.enum(CURRENCIES),
  contactEmail: z
    .string()
    .trim()
    .max(120)
    .refine((value) => value === '' || z.string().email().safeParse(value).success, 'Ingresá un email válido'),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const productReorderSchema = z.object({
  sectionId: z.string().uuid().nullable(),
  ids: z.array(z.string().uuid()).min(1),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Ingresá un email válido'),
  password: z.string().min(1, 'Ingresá la contraseña'),
});
