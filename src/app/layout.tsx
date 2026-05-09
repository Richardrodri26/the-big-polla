import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	weight: ["400", "500", "600", "700", "800", "900"],
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains",
	weight: ["400", "500", "600", "700"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "The Big Polla",
	description: "Football prediction app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
			<body>
				<ThemeProvider>
					<main className="app-shell">{children}</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
