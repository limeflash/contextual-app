import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM categorized_texts ORDER BY created_at DESC LIMIT 10');
    client.release();

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching categorizations:', error);
    return NextResponse.json({ error: 'Failed to fetch categorizations' }, { status: 500 });
  }
}