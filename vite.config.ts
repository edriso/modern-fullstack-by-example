/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: '/modern-fullstack-by-example/',
	plugins: [
		// File-based routing. The plugin watches src/routes/** and generates
		// src/routeTree.gen.ts so the router knows every route at compile time.
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
	],
	server: {
		port: 5173,
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/tests/setup.ts"],
		include: ["src/**/*.test.{ts,tsx}"],
	},
});
