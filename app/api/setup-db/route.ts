import { NextResponse } from 'next/server';
import { seedDatabase } from '../../../prisma/seed';

export async function GET() {
  try {
    // Run the native seed function
    await seedDatabase();

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
