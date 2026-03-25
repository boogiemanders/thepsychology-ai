"use client";

import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
});

const DESKTOP_SPLINE_SCENE =
  "https://prod.spline.design/5Vh4gTb7J89r4Q9n/scene.splinecode?v=11";

export default function SplineVideoExportPage() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#edf0f2] flex items-center justify-center p-0">
      <div
        data-export-canvas
        className="relative w-[1280px] h-[720px] overflow-hidden bg-[#edf0f2]"
      >
        <style>{`
          nextjs-portal,
          #__next-build-watcher,
          [data-nextjs-toast],
          [data-nextjs-dev-tools-button] {
            display: none !important;
            visibility: hidden !important;
          }

          .export-spline-wrap {
            width: 200%;
            height: 220%;
            left: -50%;
            top: -71%;
            transform: scale(0.51);
          }

          .export-spline-wrap a[href*="spline.design"] {
            display: none !important;
          }
        `}</style>

        <div className="export-spline-wrap absolute z-[1] origin-center">
          <Spline scene={DESKTOP_SPLINE_SCENE} />
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-20 bg-[#edf0f2]" />
        <div className="pointer-events-none absolute bottom-0 right-0 z-10 h-28 w-56 bg-[#edf0f2]" />
      </div>
    </div>
  );
}
