import { type Request, type Response } from 'express';
import * as productService from '../services/productService';

/**
 * Product Controller
 * Handles HTTP requests for product operations
 */

/**
 * List products with pagination and filters
 * GET /api/products (public) or GET /api/admin/products (admin)
 */
export const listProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const inStockOnly = req.query.inStockOnly === 'true' || req.query.inStockOnly === '1';
    
    // TEMPORARILY DISABLED: Admin check removed for testing
    // const isAdmin = (req as any).user?.role === 'admin';
    const isAdmin = true; // TEMPORARILY SET TO TRUE - Allow seeing inactive products

    const result = await productService.listProducts({
      page,
      limit,
      category,
      search,
      inStockOnly: inStockOnly || undefined,
      includeInactive: isAdmin, // Admin can see all products including inactive
    });

    res.status(200).json(result);
  } catch (error) {
    // Re-throw to be handled by global error handler
    throw error;
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await productService.getProductById(id);

    if (!product) {
      res.status(404).json({
        error: true,
        message: 'Product not found',
      });
      return;
    }

    res.status(200).json(product);
  } catch (error) {
    // Re-throw to be handled by global error handler
    throw error;
  }
};

/**
 * Create a new product (admin only)
 * POST /api/admin/products
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[POST /api/admin/products] Request received:', {
      method: req.method,
      url: req.url,
      body: req.body,
      headers: req.headers,
    });
    
    const productData = req.body;

    const product = await productService.createProduct(productData);

    console.log('[POST /api/admin/products] Product created successfully:', product.id);
    res.status(201).json(product);
  } catch (error) {
    // Re-throw to be handled by global error handler
    throw error;
  }
};

/**
 * Update product (admin only)
 * PUT /api/admin/products/:id
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await productService.updateProduct(id, updateData);

    if (!product) {
      res.status(404).json({
        error: true,
        message: 'Product not found',
      });
      return;
    }

    res.status(200).json(product);
  } catch (error) {
    // Re-throw to be handled by global error handler
    throw error;
  }
};

/**
 * Update product stock quantity (admin only)
 * PATCH /api/admin/products/:id/stock
 */
export const updateProductStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stockQty } = req.body;

    const product = await productService.updateProductStock(id, stockQty);

    if (!product) {
      res.status(404).json({
        error: true,
        message: 'Product not found',
      });
      return;
    }

    res.status(200).json(product);
  } catch (error) {
    // Re-throw to be handled by global error handler
    throw error;
  }
};

/**
 * Delete product (admin only, optional)
 * DELETE /api/admin/products/:id
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const hardDelete = req.query.hardDelete === 'true';

    const result = await productService.deleteProduct(id, hardDelete);

    if (!result) {
      res.status(404).json({
        error: true,
        message: 'Product not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    // Re-throw to be handled by global error handler
    throw error;
  }
};
