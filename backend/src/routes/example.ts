import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest, body, query } from '../middleware/validateRequest';

const router = Router();

/**
 * Example route with validation
 * POST /example
 * Body: { name: string, email: string }
 * Query: ?page=number
 */
router.post(
  '/example',
  validateRequest({
    body: [
      body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
      body('email').isEmail().withMessage('Valid email is required'),
    ],
    query: [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    ],
  }),
  asyncHandler(async (req: Request, res: Response) => {
    // At this point, req.body and req.query are validated
    const { name, email } = req.body;
    const page = req.query.page ? Number(req.query.page) : 1;

    // Example response
    res.status(200).json({
      success: true,
      message: 'Example route executed successfully',
      data: {
        name,
        email,
        page,
      },
    });
  })
);

/**
 * Example GET route
 * GET /example
 */
router.get(
  '/example',
  validateRequest({
    query: [
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    ],
  }),
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'GET example route',
    });
  })
);

export default router;

