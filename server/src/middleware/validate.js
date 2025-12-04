const { z } = require('zod');

// Validation schemas
const schemas = {
  register: z.object({
    username: z
      .string()
      .min(2, 'Username must be at least 2 characters')
      .max(20, 'Username cannot exceed 20 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(4, 'Password must be at least 4 characters'),
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  createChannel: z.object({
    name: z
      .string()
      .min(2, 'Channel name must be at least 2 characters')
      .max(50, 'Channel name cannot exceed 50 characters')
      .regex(/^[a-z0-9-]+$/, 'Channel name can only contain lowercase letters, numbers, and hyphens'),
    description: z.string().max(200).optional(),
  }),

  sendMessage: z.object({
    room: z.string().min(1, 'Room is required'),
    message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  }),
};

/**
 * Validation middleware factory
 */
const validate = (schemaName) => (req, res, next) => {
  try {
    const schema = schemas[schemaName];
    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found`);
    }

    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }
    next(error);
  }
};

module.exports = { validate, schemas };
