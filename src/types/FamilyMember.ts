export interface FamilyMember {
  id: string;
  name: string;
  parent_id?: string | null;
  birth_date?: string | null;
  gender?: 'ذكر' | 'أنثى' | null;
  phone?: string | null;
  notes?: string | null;
  is_alive?: boolean;
  date_of_death?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FamilyMemberWithLevel extends FamilyMember {
  level: number;
  children_count?: number;
}

export interface FamilyMemberFormData {
  name: string;
  parent_id: string;
  birth_date: string;
  gender: string;
  phone: string;
  notes: string;
  is_alive: boolean;
  date_of_death: string;
}