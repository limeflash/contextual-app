import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

export async function POST(request: Request) {
  try {
    const { inputText, category, description, tags } = await request.json();

    // Ensure tags is always an array
    const tagsArray = Array.isArray(tags) ? tags : [];

    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO categorized_texts (input_text, category, description, tags) VALUES ($1, $2, $3, $4) RETURNING id',
      [inputText, category, description, JSON.stringify(tagsArray)]
    );
    client.release();

    return NextResponse.json({ id: result.rows[0].id }, { status: 200 });
  } catch (error) {
    console.error('Error storing categorization:', error);
    return NextResponse.json({ error: 'Failed to store categorization' }, { status: 500 });
  }
}
