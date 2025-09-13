import { defineConfig } from "commandkit";
import { devtools } from "@commandkit/devtools";

export default defineConfig({
  plugins: [...(process.env.NODE_ENV === "development" ? [devtools()] : [])],
});
