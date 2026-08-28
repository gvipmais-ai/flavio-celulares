import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function GET() {
  try {
    // Run prisma db push
    const outputPush = execSync('npx prisma db push --accept-data-loss', {
      encoding: 'utf-8',
      env: { ...process.env },
    });

    // Run seed
    const outputSeed = execSync('npx tsx prisma/seed.ts', {
      encoding: 'utf-8',
      env: { ...process.env },
    });

    return NextResponse.json({
      success: true,
      push: outputPush,
      seed: outputSeed,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stdout: error.stdout?.toString(),
        stderr: error.stderr?.toString(),
      },
      { status: 500 }
    );
  }
}
