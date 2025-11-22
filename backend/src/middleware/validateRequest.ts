import { type Request, type Response, type NextFunction } from 'express';
import { body, query, param, validationResult, type ValidationChain } from 'express-validator';

/**
 * Validation schema shape for request validation
 */
export interface ValidationSchema {
  body?: ValidationChain[];
  query?: ValidationChain[];
  params?: ValidationChain[];
}

/**
 * Validates request based on provided schema
 * Returns 400 with validation errors if validation fails
 *
 * @example
 * ```ts
 * const validateCreateUser = validateRequest({
 *   body: [
 *     body('email').isEmail().withMessage('Valid email is required'),
 *     body('name').notEmpty().withMessage('Name is required'),
 *   ],
 * });
 *
 * router.post('/users', validateCreateUser, asyncHandler(async (req, res) => {
 *   // req.body is validated here
 *   const user = await createUser(req.body);
 *   res.json(user);
 * }));
 * ```
 */
export const validateRequest = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    const validations: ValidationChain[] = [
      ...(schema.body || []),
      ...(schema.query || []),
      ...(schema.params || []),
    ];

    // Execute all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format validation errors
      const formattedErrors = errors.array().map((error) => ({
        field: error.type === 'field' ? error.path : undefined,
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined,
      }));

      // Use error handler format
      res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: formattedErrors,
      });
      return;
    }

    next();
  };
};

/**
 * Convenience exports for common validators
 */
export { body, query, param };

