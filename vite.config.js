import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages の場合: base を "/" に設定
// リポジトリ名が okano-every.github.io の場合はそのまま "/"
// サブリポジトリ(例: /portal)の場合は "/portal/" に変更
export default defineConfig({
  plugins: [react()],
  base: "/",
});
