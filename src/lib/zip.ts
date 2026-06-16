import JSZip from "jszip";
import { buildReactExportFiles } from "@/lib/generated-react";

export async function exportToZip(
  outputMode: "react-tailwind" | "html-css",
  title: string,
  files: {
    appTsx?: string;
    indexHtml?: string;
    stylesCss?: string;
    scriptJs?: string;
    generatedFiles?: Record<string, string>;
  }
): Promise<Blob> {
  const zip = new JSZip();
  const folderName = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "blueprint-export";

  if (outputMode === "react-tailwind") {
    const reactFiles = buildReactExportFiles(files.appTsx || "", files.generatedFiles || {});

    // package.json configuration for Vite + React 19 + Tailwind v4
    zip.file("package.json", JSON.stringify({
      name: folderName,
      private: true,
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview"
      },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "framer-motion": "^12.0.0",
        "lucide-react": "^1.17.0"
      },
      devDependencies: {
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "@vitejs/plugin-react": "^4.3.4",
        typescript: "^5.6.2",
        vite: "^6.0.5",
        tailwindcss: "^4.0.0"
      }
    }, null, 2));

    zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body class="bg-slate-950 text-slate-50">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);

    zip.file("vite.config.ts", `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`);

    zip.file("tsconfig.json", JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["DOM", "DOM.Iterable", "ES2020"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noImplicitReturns: true
      },
      include: ["src"]
    }, null, 2));

    const srcFolder = zip.folder("src")!;
    srcFolder.file("main.tsx", `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`);

    srcFolder.file("App.tsx", reactFiles.appTsx || "export default function App() { return <div>Empty app</div>; }");
    srcFolder.file("index.css", `@import "tailwindcss";`);

    Object.entries(reactFiles.generatedFiles || {}).forEach(([fileName, fileCode]) => {
      srcFolder.file(fileName, fileCode);
    });
    
    zip.file("README.md", `# ${title}

This React + Tailwind CSS project was generated automatically by **BlueprintAI**.

## Getting Started

1. Extract the contents of this ZIP archive.
2. Open your terminal in the extracted directory.
3. Install the dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Launch the local Vite development web server:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Open your browser to the URL displayed in the terminal to view your live web page!
`);
  } else {
    // Standalone HTML/CSS/JS export structure
    zip.file("index.html", files.indexHtml || "<h1>Empty HTML File</h1>");
    zip.file("styles.css", files.stylesCss || "/* Empty CSS Stylesheet */");
    zip.file("script.js", files.scriptJs || "// Empty Javascript Controller");
    zip.file("README.md", `# ${title}

This HTML/CSS/JS web page was generated automatically by **BlueprintAI**.

## Getting Started

1. Extract the contents of this ZIP archive.
2. Open the \`index.html\` file directly in any modern web browser to view the page. No local node server or compiling is required!
`);
  }

  return await zip.generateAsync({ type: "blob" });
}
