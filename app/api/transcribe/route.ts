import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const incoming = await req.formData();
  const audio = incoming.get("audio");

  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  const groqForm = new FormData();
  groqForm.append("file", audio, "note.webm");
  groqForm.append("model", "whisper-large-v3");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: groqForm,
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: "Transcription failed", detail }, { status: 502 });
  }

  const data = (await res.json()) as { text: string };
  return NextResponse.json({ transcript: data.text });
}
