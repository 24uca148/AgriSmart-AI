import { z } from 'zod';
import { registerUserSchema, loginUserSchema, insertPredictionSchema, uploadSoilReportSchema, predictions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  predictions: {
    list: {
      method: 'GET' as const,
      path: '/api/predictions' as const,
      responses: {
        200: z.array(z.custom<typeof predictions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/predictions' as const,
      input: insertPredictionSchema,
      responses: {
        201: z.custom<typeof predictions.$inferSelect>(),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    syntheticData: {
      method: 'POST' as const,
      path: '/api/synthetic-data' as const,
      responses: {
        200: z.object({ message: z.string() }),
        500: errorSchemas.internal,
      }
    }
  },
  admin: {
    listUsers: {
      method: 'GET' as const,
      path: '/api/admin/users' as const,
      responses: {
        200: z.object({ users: z.array(z.any()) }),
        401: errorSchemas.internal,
        403: errorSchemas.internal,
      },
    },
  },
  soilReport: {
    upload: {
      method: 'POST' as const,
      path: '/api/soil-report' as const,
      input: uploadSoilReportSchema,
      responses: {
        200: z.object({ message: z.string(), soilReportImage: z.string() }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
  },
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: registerUserSchema,
      responses: {
        201: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        409: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: loginUserSchema,
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.object({ user: z.any().nullable() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
