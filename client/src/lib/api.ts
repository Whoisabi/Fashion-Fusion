import type { User, Product, Category, CartItem, Order, Address } from "@shared/schema";

const API_BASE = '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string; role?: string }) =>
      request<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    login: (data: { email: string; password: string }) =>
      request<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getMe: () => request<User>('/auth/me'),
  },

  products: {
    getAll: (params?: { categoryId?: string; search?: string }) => {
      const filteredParams: Record<string, string> = {};
      if (params?.categoryId) filteredParams.categoryId = params.categoryId;
      if (params?.search) filteredParams.search = params.search;
      const query = new URLSearchParams(filteredParams).toString();
      return request<Product[]>(`/products${query ? `?${query}` : ''}`);
    },
    
    getById: (id: string) => request<Product>(`/products/${id}`),
    
    create: (data: any) =>
      request<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: any) =>
      request<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      request<{ success: boolean }>(`/products/${id}`, {
        method: 'DELETE',
      }),
  },

  categories: {
    getAll: () => request<Category[]>('/categories'),
    
    create: (data: { name: string; slug: string; image?: string }) =>
      request<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  cart: {
    get: () => request<{ cart: any; items: (CartItem & { product: Product })[] }>('/cart'),
    
    addItem: (data: { productId: string; quantity: number; size?: string }) =>
      request<CartItem>('/cart/items', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    updateItem: (id: string, quantity: number) =>
      request<CartItem>(`/cart/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }),
    
    removeItem: (id: string) =>
      request<{ success: boolean }>(`/cart/items/${id}`, {
        method: 'DELETE',
      }),
  },

  orders: {
    getAll: () => request<Order[]>('/orders'),
    
    create: (data: { shippingAddressId: string; items: any[] }) =>
      request<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    updateStatus: (id: string, status: string) =>
      request<Order>(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  },

  addresses: {
    getAll: () => request<Address[]>('/addresses'),
    
    create: (data: any) =>
      request<Address>('/addresses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  upload: async (file: File): Promise<{ url: string }> => {
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Upload failed');
    }

    return response.json();
  },
};
