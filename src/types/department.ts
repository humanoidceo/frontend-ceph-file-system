export interface Department {
  id: number;
  name: string;
  code?: string | null;
  quota_bytes?: number | null;
  used_bytes?: number;
  available_bytes?: number | null;
  bucket_name?: string | null;
  bucket_created_at?: string | null;
}
