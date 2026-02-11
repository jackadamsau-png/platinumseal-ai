export const metadata = {
  title: "Platinum Seal AI",
  description: "AI endpoint for shower mockups"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui" }}>{children}</body>
    </html>
  );
}
