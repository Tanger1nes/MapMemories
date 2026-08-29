import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    // Call Deezer's public search API
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=10`,
    );
    const data = await res.json();

    // Deezer returns results in data.data
    const tracks = data.data || [];

    // Format to match our frontend
    const results = tracks.map((track) => ({
      id: track.id,
      name: track.title,
      artist: track.artist.name,
      albumArt: track.album.cover_medium || "",
      previewUrl: track.preview, // direct MP3 preview
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Deezer API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Deezer" },
      { status: 500 },
    );
  }
}
