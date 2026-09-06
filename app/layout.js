import { AuthProvider } from "../context/AuthContext";
import "./globals.css"; 

export const metadata = {
  title: "MapMemories",
  description: "Spatial Nostalgia - Music memories on a map",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}