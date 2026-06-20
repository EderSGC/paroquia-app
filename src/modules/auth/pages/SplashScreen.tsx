import { useEffect, useState } from "react";

import { AppLogo } from "../../../core/ui/AppLogo";
import type { Paroquia } from "../../../core/types/app.types";
import { BRAND_IMAGE_SRC } from "../../../core/utils/image";

interface SplashScreenProps {
  paroquia: Paroquia | null;
  onDone: () => void;
}

export function SplashScreen({ paroquia, onDone }: SplashScreenProps) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const fadeIn = window.setTimeout(() => setOpacity(1), 100);
    const fadeOut = window.setTimeout(() => setOpacity(0), 2200);
    const finish = window.setTimeout(onDone, 2800);

    return () => {
      window.clearTimeout(fadeIn);
      window.clearTimeout(fadeOut);
      window.clearTimeout(finish);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `linear-gradient(180deg, rgba(5,11,23,0.38), rgba(5,11,23,0.78)), url(${BRAND_IMAGE_SRC})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transition: "opacity 0.6s ease",
        gap: 20,
        overflow: "hidden",
      }}
    >
      {paroquia && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 999,
            padding: "10px 16px 10px 10px",
            backdropFilter: "blur(12px)",
            position: "relative",
            boxShadow: "0 20px 70px rgba(0, 0, 0, 0.25)",
          }}
        >
          <AppLogo
            logoPath={paroquia.logo_path}
            alt="Logo da paróquia"
            size={44}
            radius={14}
            fallbackText={paroquia.nome?.[0] ?? "P"}
            background="rgba(255,255,255,0.95)"
            padding={2}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#f4e2bc", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Sistema Paroquial
            </span>
            <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{paroquia.nome}</span>
          </div>
        </div>
      )}
      <div style={{ textAlign: "center", position: "relative" }}>
        <div style={{ color: "white", fontSize: 24, fontWeight: 700, letterSpacing: "-0.3px", position: "relative" }}>
          {paroquia?.nome || "Sistema Paroquial"}
        </div>
        {paroquia?.diocese && (
          <div style={{ color: "#c8d3f0", fontSize: 13, marginTop: 4, position: "relative" }}>{paroquia.diocese}</div>
        )}
      </div>
      <div style={{ marginTop: 32, display: "flex", gap: 6 }}>
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#f5d69b",
              animation: `pulse 1.2s ease-in-out ${item * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
