import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const CUSTOM_OPTION = '__CUSTOM__';

export const DEFAULT_CATEGORIES = [
  'Bangla Medium',
  'English Medium',
  'English Version',
  'Madrasah Medium',
  'Cambridge Curriculum',
  'Edexcel Curriculum',
  'Spoken',
  'Quran',
  'IELTS'
];

export const DEFAULT_CLASSES_BY_CATEGORY = {
  'Bangla Medium': [
    'Play', 'Nursery', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'SSC',
    'Class 11', 'Class 12', 'HSC', 'Admission Test'
  ],
  'English Version': [
    'Play', 'Nursery', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'SSC',
    'Class 11', 'Class 12', 'HSC', 'Admission Test'
  ],
  'Madrasah Medium': [
    'Play', 'Nursery', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Dakhil', 'Alim', 'Admission Test'
  ],
  'English Medium': [
    'Play', 'Nursery', 'KG', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4',
    'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8',
    'O Level', 'A Level', 'Admission Test'
  ],
  'Cambridge Curriculum': [
    'Play', 'Nursery', 'KG', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4',
    'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8',
    'O Level', 'A Level', 'Admission Test'
  ],
  'Edexcel Curriculum': [
    'Play', 'Nursery', 'KG', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4',
    'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8',
    'O Level', 'A Level', 'Admission Test'
  ],
  'Spoken': [
    'Kids Spoken', 'Beginner', 'Intermediate', 'Advanced',
    'Business English', 'Pronunciation & Fluency', 'Presentation Skills'
  ],
  'Quran': [
    'Qaida (Noorani)', 'Ampara / Nazera', 'Hifz (Memorization)',
    'Tajweed', 'Tafsir & Translation', 'Arabic Grammar'
  ],
  'IELTS': [
    'IELTS General Training', 'IELTS Academic', 'Speaking & Listening',
    'Reading & Writing', 'Crash Course', 'Mock Test & Evaluation'
  ]
};

export const DEFAULT_COURSES = Array.from(
  new Set(Object.values(DEFAULT_CLASSES_BY_CATEGORY).flat())
);

/**
 * Fetches dynamic categories and courses from Supabase and merges them
 * with the default presets so Admin updates immediately reflect across
 * Guardian, Tutor, and Public pages.
 */
export function useCategoriesAndCourses() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories-and-courses'],
    queryFn: async () => {
      const [{ data: dbCategories, error: catErr }, { data: dbCourses, error: courseErr }] =
        await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('courses').select('*').order('name')
        ]);

      if (catErr) console.warn('Could not fetch dynamic categories:', catErr.message);
      if (courseErr) console.warn('Could not fetch dynamic courses:', courseErr.message);

      const categoryNames = new Set(DEFAULT_CATEGORIES);
      const categoryIdToName = {};

      (dbCategories || []).forEach((cat) => {
        if (cat?.name) {
          categoryNames.add(cat.name);
          categoryIdToName[cat.id] = cat.name;
        }
      });

      const classesByCategory = {};
      Object.entries(DEFAULT_CLASSES_BY_CATEGORY).forEach(([catName, courses]) => {
        classesByCategory[catName] = [...courses];
      });

      const allCoursesSet = new Set(DEFAULT_COURSES);

      (dbCourses || []).forEach((course) => {
        if (!course?.name) return;
        allCoursesSet.add(course.name);
        const catName = categoryIdToName[course.category_id];
        if (catName) {
          if (!classesByCategory[catName]) {
            classesByCategory[catName] = [];
          }
          if (!classesByCategory[catName].includes(course.name)) {
            classesByCategory[catName].push(course.name);
          }
        }
      });

      return {
        categories: Array.from(categoryNames),
        classesByCategory,
        allCourses: Array.from(allCoursesSet),
        dbCategories: dbCategories || [],
        dbCourses: dbCourses || []
      };
    },
    staleTime: 1000 * 60 * 5
  });

  return {
    categories: data?.categories || DEFAULT_CATEGORIES,
    classesByCategory: data?.classesByCategory || DEFAULT_CLASSES_BY_CATEGORY,
    allCourses: data?.allCourses || DEFAULT_COURSES,
    dbCategories: data?.dbCategories || [],
    dbCourses: data?.dbCourses || [],
    isLoading
  };
}
