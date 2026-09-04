import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FitMed — Medical Fitness Certificate Online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #0B2D5C 0%, #071d3d 60%, #0B2D5C 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Teal glow orb top-right */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(18, 184, 176, 0.18)",
            filter: "blur(60px)",
          }}
        />
        {/* Teal glow orb bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(18, 184, 176, 0.12)",
            filter: "blur(50px)",
          }}
        />

        {/* Shield + tick icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "rgba(18, 184, 176, 0.2)",
            border: "2px solid rgba(18, 184, 176, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "28px",
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
              fill="rgba(18,184,176,0.25)"
              stroke="#12B8B0"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="#12B8B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "800",
            color: "#ffffff",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: "16px",
          }}
        >
          Fit
          <span style={{ color: "#12B8B0" }}>Med</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "26px",
            color: "rgba(255,255,255,0.75)",
            fontWeight: "400",
            letterSpacing: "0.5px",
            marginBottom: "36px",
          }}
        >
          Fit, Verified, and Ready.
        </div>

        {/* Descriptor pills row */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexDirection: "row",
          }}
        >
          {[
            "Medical Fitness Certificates",
            "Video Doctor Consultation",
            "QR-Verifiable · Rwanda",
          ].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 20px",
                borderRadius: "100px",
                background: "rgba(18, 184, 176, 0.12)",
                border: "1px solid rgba(18, 184, 176, 0.35)",
                color: "#12B8B0",
                fontSize: "15px",
                fontWeight: "600",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL footer */}
        <div
          style={{
            position: "absolute",
            bottom: "28px",
            fontSize: "16px",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "1px",
          }}
        >
          fitnessmed.rw
        </div>
      </div>
    ),
    { ...size }
  );
}
