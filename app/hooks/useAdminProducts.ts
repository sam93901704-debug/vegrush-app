import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/config/api';
import { apiFetch } from '@/utils/apiFetch';
import type { Product, ProductsResponse } from './useProducts';

interface FetchAdminProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  inStockOnly?: boolean;
}

// Fetch admin products (includes inactive)
export function useAdminProducts(params: FetchAdminProductsParams = {}) {
  return useQuery({
    queryKey: ['admin-products', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.category) searchParams.append('category', params.category);
      if (params.search) searchParams.append('search', params.search);
      if (params.inStockOnly) searchParams.append('inStockOnly', 'true');

      const response = await apiFetch(`/api/admin/products?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json() as Promise<ProductsResponse>;
    },
  });
}

// Update stock mutation
export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stockQty }: { id: string; stockQty: number }) => {
      const response = await apiFetch(`/api/admin/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stockQty }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update stock');
      }

      return response.json() as Promise<Product>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Delete product mutation
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, hardDelete }: { id: string; hardDelete?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (hardDelete) searchParams.append('hardDelete', 'true');

      const response = await apiFetch(`/api/admin/products/${id}?${searchParams.toString()}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to delete product');
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

