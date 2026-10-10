import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const themeScript = `(function(){try{var theme=localStorage.getItem("prompt-gym:theme");var root=document.documentElement;if(theme==="light"){root.classList.remove("dark")}else{root.classList.add("dark")}}catch(e){}})();`;

export const metadata: Metadata = {
  title: "提示词打分系统",
  description: "提示词练习与打分",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body>
        <Script id="theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
