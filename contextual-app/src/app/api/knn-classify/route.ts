import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { KNNClassifier } from '@/lib/knn-classifier';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

export async function POST(request: Request) {
  try {
    const { tags, aiSuggestedCategory } = await request.json();
    console.log("Received tags for KNN classification:", tags);
    console.log("AI suggested category:", aiSuggestedCategory);

    const client = await pool.connect();
    const result = await client.query('SELECT tags, category FROM categorized_texts');
    client.release();

    console.log("Number of entries in database:", result.rows.length);

    const knn = new KNNClassifier(5, 0.01);

    result.rows.forEach(row => {
      // Убедимся, что tags - это массив
      const rowTags = Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags);
      console.log("Adding entry:", { tags: rowTags, category: row.category });
      knn.addEntry(rowTags, row.category);
    });

    const predictedCategory = knn.predict(tags);
    console.log("KNN predicted category:", predictedCategory);

    return NextResponse.json({ 
      category: predictedCategory || aiSuggestedCategory, 
      isDefaultCategory: !predictedCategory
    }, { status: 200 });
  } catch (error) {
    console.error('Error classifying with KNN:', error);
    return NextResponse.json({ error: 'Failed to classify using KNN' }, { status: 500 });
  }
}
