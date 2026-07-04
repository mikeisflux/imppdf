import { NextResponse } from 'next/server';
import { authApiKey } from '@/lib/apiauth';
import { runPipeline } from '@/lib/impose-server';
import { recordApiImpose } from '@/lib/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST a PDF + a steps pipeline, get an imposed PDF back.
// multipart/form-data:  file=@doc.pdf  steps=[{"kind":"Grid","columns":2,"rows":2}]
// or application/json:   { "fileBase64": "...", "steps": [...] }
export async function POST(req: Request) {
  const auth = authApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: 'Invalid or missing API key.' }, { status: 401 });
  }

  let bytes: Uint8Array | null = null;
  let steps: any[] = [];

  const ctype = req.headers.get('content-type') || '';
  try {
    if (ctype.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (!(file instanceof File)) return NextResponse.json({ error: 'Missing "file".' }, { status: 400 });
      bytes = new Uint8Array(await file.arrayBuffer());
      const stepsRaw = form.get('steps');
      steps = stepsRaw ? JSON.parse(String(stepsRaw)) : [];
    } else {
      const body = await req.json();
      if (body.fileBase64) bytes = new Uint8Array(Buffer.from(body.fileBase64, 'base64'));
      steps = body.steps || [];
    }
  } catch {
    return NextResponse.json({ error: 'Could not parse request. Send a file and a steps JSON array.' }, { status: 400 });
  }

  if (!bytes || bytes.length === 0) return NextResponse.json({ error: 'Empty or missing PDF.' }, { status: 400 });
  if (!Array.isArray(steps) || steps.length === 0) {
    return NextResponse.json({ error: 'Provide a non-empty "steps" array.' }, { status: 400 });
  }

  const inputBytes = bytes.length;
  let out: Uint8Array;
  try {
    out = await runPipeline(bytes, steps);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Imposition failed.' }, { status: 422 });
  }

  // Meter by input bytes processed.
  recordApiImpose(auth.userId, auth.keyId, inputBytes);

  return new NextResponse(Buffer.from(out), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="imposed.pdf"',
      'X-Input-Bytes': String(inputBytes),
    },
  });
}
