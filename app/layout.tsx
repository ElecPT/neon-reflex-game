import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "霓虹反应｜30 秒反应挑战",
  description: "追上随机亮起的光点，在 30 秒内挑战你的反应速度与最高连击。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
