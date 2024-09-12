import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

export async function DELETE(request: Request) {
  const { id } = await request.json();

  try {
    const client = await pool.connect();
    await client.query('DELETE FROM categorized_texts WHERE id = $1', [id]);
    client.release();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting categorization:', error);
    return NextResponse.json({ error: 'Failed to delete categorization' }, { status: 500 });
  }
}