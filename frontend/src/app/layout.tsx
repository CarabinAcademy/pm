import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مدیر پروژه | تختهٔ کانبان",
  description: "تختهٔ ساده و فارسی برای تبدیل ایده‌ها به کارهای انجام‌شده.",
  icons: {
    icon: "/project-manager-logo.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
