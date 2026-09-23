import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Sirve fotos públicas de Drive desde el mismo dominio de la app.
 * Esto evita bloqueos CORS en las miniaturas y al generar los PDF.
 */
export async function GET(request: Request) {
  const fileId = new URL(request.url).searchParams.get('fileId') ?? ''

  if (!/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
    return NextResponse.json({ error: 'invalid_file_id' }, { status: 400 })
  }

  try {
    const driveResponse = await fetch(
      `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
      { redirect: 'follow', cache: 'no-store' },
    )

    if (!driveResponse.ok) {
      return NextResponse.json(
        { error: 'drive_photo_unavailable' },
        { status: driveResponse.status },
      )
    }

    const contentType = driveResponse.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'invalid_photo_response' }, { status: 502 })
    }

    return new NextResponse(await driveResponse.arrayBuffer(), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'photo_proxy_failed', detail: String(error) },
      { status: 502 },
    )
  }
}
