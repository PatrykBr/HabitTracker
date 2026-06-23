import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#191f2d",
          borderRadius: 40,
          color: "#f2eee3",
          display: "flex",
          fontFamily: "Georgia, serif",
          fontSize: 110,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          position: "relative",
          width: "100%",
        }}
      >
        R
        <div
          style={{
            background: "#a9d8c8",
            borderRadius: 999,
            height: 30,
            position: "absolute",
            right: 28,
            top: 24,
            width: 30,
          }}
        />
      </div>
    ),
    size,
  );
}
