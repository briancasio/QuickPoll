import "./globals.css";

export const metadata = {
  title: "Voice Poll",
  description: "Create and vote on live polls with voice input",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
