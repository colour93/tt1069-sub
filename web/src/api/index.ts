export const API_BASE = '/api';

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Author {
  id: number;
  name: string;
}

export interface NovelThread {
  id: number;
  title: string;
  subscribed: boolean;
  publishedAt?: string;
  latestPostAt?: string;
  lastSyncedAt?: string;
  author?: Author;
  postCount: number;
}

export interface NovelPost {
  id: number;
  threadId: number;
  floor?: number;
  content: string;
  publishedAt?: string;
}

export const api = {
  getNovels: async (params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    subscribed?: boolean;
    sort?: 'latestPostAt' | 'publishedAt';
  }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.keyword) searchParams.set('keyword', params.keyword);
    if (params.subscribed !== undefined) searchParams.set('subscribed', params.subscribed.toString());
    if (params.sort) searchParams.set('sort', params.sort);

    const res = await fetch(`${API_BASE}/novels?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch novels');
    return (await res.json()) as PaginatedResponse<NovelThread>;
  },

  getNovelDetails: async (id: number) => {
    const res = await fetch(`${API_BASE}/novels/${id}`);
    if (!res.ok) throw new Error('Failed to fetch novel details');
    return (await res.json()) as NovelThread & { posts: NovelPost[] };
  },

  getNovelPosts: async (id: number, params: {
    page?: number;
    pageSize?: number;
    order?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.order) searchParams.set('order', params.order);

    const res = await fetch(`${API_BASE}/novels/${id}/posts?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    return (await res.json()) as PaginatedResponse<NovelPost>;
  },

  toggleSubscribe: async (id: number, subscribed: boolean) => {
    const res = await fetch(`${API_BASE}/novels/${id}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscribed }),
    });
    if (!res.ok) throw new Error('Failed to toggle subscription');
    return await res.json();
  },

  fetchNovel: async (params: { threadId?: number; url?: string }) => {
    const res = await fetch(`${API_BASE}/novels/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to fetch novel');
    return await res.json();
  },
};

