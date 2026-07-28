import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/cookies';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { base64Data, filename } = body;

    if (!base64Data) {
      return NextResponse.json({ error: 'Nenhuma imagem fornecida' }, { status: 400 });
    }

    // Remove the prefix "data:image/jpeg;base64,"
    const base64Image = base64Data.split(';base64,').pop();
    if (!base64Image) {
      return NextResponse.json({ error: 'Formato de imagem inválido' }, { status: 400 });
    }

    // Create a unique filename
    const uniqueName = `${Date.now()}_${filename || 'photo.jpg'}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'os-photos');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });

    // Return the public URL
    const publicUrl = `/uploads/os-photos/${uniqueName}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Falha ao salvar imagem' }, { status: 500 });
  }
}
