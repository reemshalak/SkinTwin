import { ImageResponse } from "next/og";

// App icon drawn in code: a plum tile with an "S" and a pink twin dot.
export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = Math.min(1024, Math.max(48, Number.parseInt(raw, 10) || 512));
  const maskable = raw.endsWith("m");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #E58FB0 0%, #8A3F66 60%, #5B2443 100%)",
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        <div style={{ display: "flex", position: "relative", color: "white", fontSize: size * 0.56, fontWeight: 700, fontFamily: "serif", lineHeight: 1 }}>
          S
          <div style={{ position: "absolute", right: -size * 0.1, top: size * 0.02, width: size * 0.13, height: size * 0.13, borderRadius: 999, background: "#FFD3E2" }} />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
