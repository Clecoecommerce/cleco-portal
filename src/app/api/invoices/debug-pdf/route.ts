import { NextRequest, NextResponse } from "next/server";
export const maxDuration = 30;
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 });
  const buffer = await file.arrayBuffer();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(Buffer.from(buffer));
  return NextResponse.json({ text: data.text, pages: data.numpages });
}
