import { supabase } from '../lib/supabase';

export type ProductCondition = 'NEW' | 'USED';

export interface StoreProduct {
  id: string;
  seller_id?: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  condition: ProductCondition;
  city: string;
  contact_info: string;
  image_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  seller?: {
    full_name?: string;
    membership_tier?: string;
    is_master_admin?: boolean;
  };
}

export async function fetchApprovedProducts(categoryFilter?: string): Promise<StoreProduct[]> {
  let query = supabase
    .from('morfeus_store_products')
    .select(`
      *,
      seller:morfeus_profiles!morfeus_store_products_seller_id_fkey(full_name, membership_tier, is_master_admin)
    `)
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false });

  if (categoryFilter && categoryFilter !== 'Tümü') {
    query = query.eq('category', categoryFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Ürünler çekilemedi:', error);
    return [];
  }
  return data as StoreProduct[];
}

export async function createProductListing(productData: {
  seller_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  condition: ProductCondition;
  city: string;
  contact_info: string;
  image_url?: string;
}) {
  const { data, error } = await supabase
    .from('morfeus_store_products')
    .insert([{ ...productData, status: 'PENDING' }])
    .select()
    .single();

  if (error) throw error;
  return data as StoreProduct;
}

export async function fetchAllProductsAdmin(): Promise<StoreProduct[]> {
  const { data, error } = await supabase
    .from('morfeus_store_products')
    .select(`
      *,
      seller:morfeus_profiles!morfeus_store_products_seller_id_fkey(full_name, membership_tier, is_master_admin)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin ürünleri alınamadı:', error);
    return [];
  }
  return data as StoreProduct[];
}

export async function updateProductStatusAdmin(productId: string, status: 'APPROVED' | 'REJECTED') {
  const { error } = await supabase
    .from('morfeus_store_products')
    .update({ status })
    .eq('id', productId);

  if (error) throw error;
}