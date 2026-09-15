import { supabase } from '../lib/supabase';

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface MorpheusCourse {
  id: string;
  instructor_id?: string;
  title: string;
  description: string;
  instrument: string;
  level: CourseLevel;
  price_amount: number;
  is_free: boolean;
  thumbnail_url?: string;
  preview_video_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  instructor?: {
    full_name?: string;
    membership_tier?: string;
    is_master_admin?: boolean;
  };
}

export interface CourseLesson {
  id: string;
  course_id: string;
  title: string;
  duration_min: number;
  video_url: string;
  lesson_order: number;
  is_preview: boolean;
  created_at: string;
}

export async function fetchApprovedCourses(instrumentFilter?: string): Promise<MorpheusCourse[]> {
  let query = supabase
    .from('morfeus_courses')
    .select(`
      *,
      instructor:morfeus_profiles!morfeus_courses_instructor_id_fkey(full_name, membership_tier, is_master_admin)
    `)
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false });

  if (instrumentFilter && instrumentFilter !== 'Tümü') {
    query = query.eq('instrument', instrumentFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Kurslar çekilemedi:', error);
    return [];
  }
  return data as MorpheusCourse[];
}

export async function fetchCourseLessons(courseId: string): Promise<CourseLesson[]> {
  const { data, error } = await supabase
    .from('morfeus_course_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('lesson_order', { ascending: true });

  if (error) {
    console.error('Dersler çekilemedi:', error);
    return [];
  }
  return data as CourseLesson[];
}

export async function createCourseSubmission(courseData: {
  instructor_id: string;
  title: string;
  description: string;
  instrument: string;
  level: CourseLevel;
  price_amount: number;
  is_free: boolean;
  preview_video_url?: string;
}) {
  const { data, error } = await supabase
    .from('morfeus_courses')
    .insert([{ ...courseData, status: 'PENDING' }])
    .select()
    .single();

  if (error) throw error;
  return data as MorpheusCourse;
}

export async function fetchPendingCoursesAdmin(): Promise<MorpheusCourse[]> {
  const { data, error } = await supabase
    .from('morfeus_courses')
    .select(`
      *,
      instructor:morfeus_profiles!morfeus_courses_instructor_id_fkey(full_name, membership_tier, is_master_admin)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin kursları çekilemedi:', error);
    return [];
  }
  return data as MorpheusCourse[];
}

export async function updateCourseStatusAdmin(courseId: string, status: 'APPROVED' | 'REJECTED') {
  const { error } = await supabase
    .from('morfeus_courses')
    .update({ status })
    .eq('id', courseId);

  if (error) throw error;
}