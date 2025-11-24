import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/config/api';
import { apiFetch } from '@/utils/apiFetch';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  unitType: string;
  unitValue: string;
  stockQty: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface FetchProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  inStockOnly?: boolean;
}

// Fetch products (customer/public)
export function useProducts(params: FetchProductsParams = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.category) searchParams.append('category', params.category);
      if (params.search) searchParams.append('search', params.search);
      if (params.inStockOnly) searchParams.append('inStockOnly', 'true');

      const response = await apiFetch(`/api/products?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json() as Promise<ProductsResponse>;
    },
  });
}

// Fetch single product
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await apiFetch(`/api/products/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      return response.json() as Promise<Product>;
    },
    enabled: !!id,
  });
}

// Create product mutation
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: {
      name: string;
      description?: string;
      category: string;
      price: number;
      unitType: string;
      unitValue: number;
      stockQty: number;
      imageUrl?: string;
      isActive?: boolean;
    }) => {
      const response = await apiFetch('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to create product');
      }

      return response.json() as Promise<Product>;
    },
    onSuccess: () => {
      // Invalidate both admin and customer product lists
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

// Update product mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...productData
    }: {
      id: string;
      name?: string;
      description?: string;
      category?: string;
      price?: number;
      unitType?: string;
      unitValue?: number;
      stockQty?: number;
      imageUrl?: string;
      isActive?: boolean;
    }) => {
      const response = await apiFetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update product');
      }

      return response.json() as Promise<Product>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
}

