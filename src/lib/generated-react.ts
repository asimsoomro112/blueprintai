export type GeneratedReactFiles = Record<string, string>;
export type SandpackFileMap = Record<string, string | { code: string; active?: boolean }>;

type RelativeImport = {
  importPath: string;
  defaultImport?: string;
  namedImports: string[];
};

type NormalizedPath = {
  key: string;
  hasDirectory: boolean;
};

const DEFAULT_APP_TSX = "export default function App() { return <div />; }";

function isIdentifier(value: string) {
  return /^[A-Za-z_$][\w$]*$/.test(value);
}

function getUniqueIdentifier(code: string, baseName: string) {
  let candidate = baseName;
  let index = 1;

  while (new RegExp(`\\b${candidate}\\b`).test(code)) {
    candidate = `${baseName}${index}`;
    index += 1;
  }

  return candidate;
}

function cleanImportList(value: string) {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function parseNamedImportSpecifiers(value: string) {
  return cleanImportList(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith("type ")) return null;

      const match = part.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
      if (!match) return null;

      return {
        imported: match[1],
        local: match[2] || match[1],
      };
    })
    .filter((item): item is { imported: string; local: string } => !!item);
}

function normalizeLucideImports(code: string) {
  const lucideImportRegex = /import\s+\{([\s\S]*?)\}\s+from\s+["']lucide-react["'];?/g;
  const namespace = getUniqueIdentifier(code, "LucideIcons");
  let insertedNamespaceImport = false;

  return code.replace(lucideImportRegex, (_match, importList: string) => {
    const specifiers = parseNamedImportSpecifiers(importList);
    const declarations = specifiers
      .map(({ imported, local }) => `const ${local} = (${namespace} as any)["${imported}"] ?? ${namespace}.Circle;`)
      .join("\n");

    if (!specifiers.length) return "";

    const importLine = insertedNamespaceImport ? "" : `import * as ${namespace} from "lucide-react";`;
    insertedNamespaceImport = true;

    return [importLine, declarations].filter(Boolean).join("\n");
  });
}

export function normalizeReactModuleCode(code: string) {
  return normalizeLucideImports(code || "");
}

function normalizePathParts(parts: string[]) {
  const safeParts: string[] = [];

  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (!safeParts.length) return null;
      safeParts.pop();
      continue;
    }
    safeParts.push(part);
  }

  return safeParts;
}

function normalizeReactFileName(fileName: string): NormalizedPath | null {
  const trimmed = fileName.trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/^\.\//, "");
  if (!trimmed) return null;

  const withoutSrc = trimmed.replace(/^src\//, "");
  if (/^app\.(t|j)sx?$/i.test(withoutSrc)) return null;

  const withExtension = /\.(t|j)sx?$/i.test(withoutSrc) || /\.css$/i.test(withoutSrc)
    ? withoutSrc
    : `${withoutSrc}.tsx`;
  const parts = normalizePathParts(withExtension.split("/"));
  if (!parts?.length) return null;

  return {
    key: parts.join("/"),
    hasDirectory: parts.length > 1,
  };
}

export function getReactPreviewFilePaths(fileName: string): string[] {
  const normalized = normalizeReactFileName(fileName);
  if (!normalized) return [];

  if (normalized.hasDirectory) {
    return [`/${normalized.key}`];
  }

  return [`/${normalized.key}`, `/components/${normalized.key}`];
}

export function getReactZipFilePaths(fileName: string): string[] {
  return getReactPreviewFilePaths(fileName).map((path) => path.replace(/^\/+/, ""));
}

function resolveReactImportPath(importPath: string, fromPath: string): string | null {
  const normalizedImport = importPath.replace(/\\/g, "/");
  if (!normalizedImport.startsWith("./") && !normalizedImport.startsWith("../")) return null;

  const fromParts = fromPath.replace(/^\/+/, "").split("/");
  const baseParts = fromParts.slice(0, -1);
  const importParts = normalizedImport.split("/");
  const pathParts = normalizePathParts([...baseParts, ...importParts]);
  if (!pathParts?.length) return null;

  const pathWithoutExtension = pathParts.join("/");
  if (/\.(css|scss|sass)$/i.test(pathWithoutExtension)) {
    return `/${pathWithoutExtension}`;
  }

  const withExtension = /\.(t|j)sx?$/i.test(pathWithoutExtension)
    ? pathWithoutExtension
    : `${pathWithoutExtension}.tsx`;

  return `/${withExtension}`;
}

function getFallbackComponentName(importPath: string) {
  const fileName = importPath.split("/").filter(Boolean).pop() || "GeneratedSection";
  const baseName = fileName.replace(/\.(t|j)sx?$/i, "");
  const pascalName = baseName
    .split(/[^A-Za-z0-9_$]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");

  return isIdentifier(pascalName) ? pascalName : "GeneratedSection";
}

function parseRelativeImports(code: string): RelativeImport[] {
  const imports: RelativeImport[] = [];
  const fromImportRegex = /import\s+([\s\S]*?)\s+from\s+["'](\.{1,2}\/[^"']+)["'];?/g;
  const sideEffectImportRegex = /import\s+["'](\.{1,2}\/[^"']+)["'];?/g;

  for (const match of code.matchAll(fromImportRegex)) {
    const clause = match[1].trim();
    const importPath = match[2].trim();
    if (clause.startsWith("type ")) continue;

    const namedMatch = clause.match(/\{([^}]*)\}/);
    const namedImports = namedMatch
      ? cleanImportList(namedMatch[1])
        .split(",")
        .map((part) => part.trim().split(/\s+as\s+/i)[0]?.trim())
        .filter((name) => name && isIdentifier(name))
      : [];

    const defaultCandidate = clause.split(",")[0]?.trim();
    const defaultImport = defaultCandidate &&
      !defaultCandidate.startsWith("{") &&
      !defaultCandidate.startsWith("*") &&
      isIdentifier(defaultCandidate)
      ? defaultCandidate
      : undefined;

    imports.push({ importPath, defaultImport, namedImports });
  }

  for (const match of code.matchAll(sideEffectImportRegex)) {
    imports.push({ importPath: match[1].trim(), namedImports: [] });
  }

  return imports;
}

function hasReactProjectFile(files: Record<string, string>, path: string) {
  if (files[path]) return true;
  const withoutExtension = path.replace(/\.(t|j)sx?$/i, "");
  return Object.keys(files).some((filePath) => filePath.replace(/\.(t|j)sx?$/i, "") === withoutExtension);
}

function createMissingComponentFile(relativeImport: RelativeImport) {
  if (/\.(css|scss|sass)$/i.test(relativeImport.importPath)) {
    return "";
  }

  const fallbackName = getFallbackComponentName(relativeImport.defaultImport || relativeImport.importPath);
  const defaultName = relativeImport.defaultImport && isIdentifier(relativeImport.defaultImport)
    ? relativeImport.defaultImport
    : fallbackName;
  const namedExports = Array.from(new Set(relativeImport.namedImports))
    .filter((name) => name !== defaultName);

  const namedCode = namedExports
    .map((name) => `export function ${name}(_props: Record<string, unknown>) {\n  return <MissingGeneratedSection label="${name}" />;\n}`)
    .join("\n\n");

  return `import React from "react";

function MissingGeneratedSection({ label }: { label: string }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-slate-700">
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs text-slate-500">BlueprintAI added this safe placeholder because the generated component file was missing.</p>
    </section>
  );
}

${namedCode ? `${namedCode}\n\n` : ""}export default function ${defaultName}(_props: Record<string, unknown>) {
  return <MissingGeneratedSection label="${defaultName}" />;
}
`;
}

export function normalizeGeneratedReact(
  appTsx: string = "",
  generatedFiles: GeneratedReactFiles = {}
) {
  const normalizedFiles: GeneratedReactFiles = {};

  Object.entries(generatedFiles || {}).forEach(([fileName, fileCode]) => {
    const normalized = normalizeReactFileName(fileName);
    if (!normalized) return;
    normalizedFiles[normalized.key] = normalizeReactModuleCode(fileCode || "");
  });

  return {
    appTsx: normalizeReactModuleCode(appTsx || DEFAULT_APP_TSX),
    generatedFiles: normalizedFiles,
  };
}

function buildReactProjectFiles(appTsx: string, generatedFiles: GeneratedReactFiles = {}) {
  const normalized = normalizeGeneratedReact(appTsx, generatedFiles);
  const projectFiles: Record<string, string> = {
    "/App.tsx": normalized.appTsx,
  };
  const canonicalPaths = new Set(["/App.tsx"]);

  Object.entries(normalized.generatedFiles).forEach(([fileName, fileCode]) => {
    const paths = getReactPreviewFilePaths(fileName);
    paths.forEach((path) => {
      projectFiles[path] = fileCode;
      canonicalPaths.add(path);
    });
  });

  const queue = Object.keys(projectFiles);
  const visited = new Set<string>();

  while (queue.length) {
    const currentPath = queue.shift()!;
    if (visited.has(currentPath)) continue;
    visited.add(currentPath);

    parseRelativeImports(projectFiles[currentPath] || "").forEach((relativeImport) => {
      const importPath = resolveReactImportPath(relativeImport.importPath, currentPath);
      if (!importPath || hasReactProjectFile(projectFiles, importPath)) return;

      projectFiles[importPath] = createMissingComponentFile(relativeImport);
      canonicalPaths.add(importPath);
      queue.push(importPath);
    });
  }

  return { projectFiles, canonicalPaths, appTsx: normalized.appTsx };
}

export function buildReactSandpackFiles(
  appTsx: string,
  generatedFiles: GeneratedReactFiles = {}
): SandpackFileMap {
  const { projectFiles } = buildReactProjectFiles(appTsx, generatedFiles);
  const files: SandpackFileMap = {};

  Object.entries(projectFiles).forEach(([path, code]) => {
    files[path] = path === "/App.tsx" ? { code, active: true } : code;
  });

  return files;
}

export function buildReactExportFiles(
  appTsx: string,
  generatedFiles: GeneratedReactFiles = {}
) {
  const { projectFiles, canonicalPaths, appTsx: normalizedAppTsx } = buildReactProjectFiles(appTsx, generatedFiles);
  const exportFiles: GeneratedReactFiles = {};

  Object.entries(projectFiles).forEach(([path, code]) => {
    if (path === "/App.tsx" || !canonicalPaths.has(path)) return;
    exportFiles[path.replace(/^\/+/, "")] = code;
  });

  return {
    appTsx: normalizedAppTsx,
    generatedFiles: exportFiles,
  };
}
