'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

const colors = [
  { name: 'BEIGE', code: '#bfb32e' },
  { name: 'PAARS', code: '#47818a' },
  { name: 'ROOD', code: '#bfb32e' },
  { name: 'BLAUW', code: '#47818a' },
  { name: 'ORANJE', code: '#617363' },
  { name: 'GROEN', code: '#6e751e' },
  { name: 'GEEL', code: '#bfb32e' },
  { name: 'TURKOOIS', code: '#47818a' },
];

const categories = [
  { name: 'Kernwaarde' },
  { name: 'Waarden' },
  { name: 'Positieve Overtuigingen' },
  { name: 'Kwaliteiten' },
  { name: 'Vaardigheden' },
  { name: 'Typisch Gedrag' },
  { name: 'Angsten' },
  { name: 'Beperkende Overtuigingen' },
  { name: 'Strenge Leefregels' },
  { name: 'Valkuilgedrag' },
  { name: 'Allergieën' },
  { name: 'Coping Gedrag' },
  { name: 'Uitdaging' },
];

export interface SeedActionResult {
  success: boolean;
  message: string;
}

export async function seedColorsAction(): Promise<SeedActionResult> {
  try {
    const colorsCollection = collection(db, 'colors');
    const snapshot = await getDocs(colorsCollection);
    if (!snapshot.empty) {
      return {
        success: false,
        message:
          'Colors collection is not empty. Seeding aborted to prevent duplicates.',
      };
    }

    const batch = writeBatch(db);
    colors.forEach((color) => {
      const docRef = doc(colorsCollection, color.name); // Use name as ID for simplicity
      batch.set(docRef, color);
    });
    await batch.commit();
    return {
      success: true,
      message: `${colors.length} colors have been seeded successfully.`,
    };
  } catch (error) {
    console.error('Error seeding colors:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to seed colors: ${errorMessage}` };
  }
}

export async function seedCategoriesAction(): Promise<SeedActionResult> {
  try {
    const categoriesCollection = collection(db, 'categories');
    const snapshot = await getDocs(categoriesCollection);
    if (!snapshot.empty) {
      return {
        success: false,
        message:
          'Categories collection is not empty. Seeding aborted to prevent duplicates.',
      };
    }

    const batch = writeBatch(db);
    categories.forEach((category) => {
      const docRef = doc(categoriesCollection, category.name); // Use name as ID
      batch.set(docRef, category);
    });
    await batch.commit();
    return {
      success: true,
      message: `${categories.length} categories have been seeded successfully.`,
    };
  } catch (error) {
    console.error('Error seeding categories:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      success: false,
      message: `Failed to seed categories: ${errorMessage}`,
    };
  }
}
