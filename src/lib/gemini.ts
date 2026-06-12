import { GoogleGenerativeAI } from "@google/generative-ai";

export const isGeminiConfigured = () => {
  return !!(
    process.env.GEMINI_API_KEY &&
    !process.env.GEMINI_API_KEY.includes("your_")
  );
};

const DEFAULT_FALLBACK_MODELS = [
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getModelCandidates(primaryModel: string): string[] {
  const configuredFallbacks = (process.env.GEMINI_FALLBACK_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return Array.from(new Set([
    primaryModel,
    ...configuredFallbacks,
    ...DEFAULT_FALLBACK_MODELS,
  ]));
}

function isRetryableGeminiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /\b(429|500|502|503|504)\b|overloaded|unavailable|temporar/i.test(message);
}

function getGeminiErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export interface GeminiConversionResponse {
  title: string;
  layoutDescription: string;
  detectedComponents: Array<{
    type: string;
    label: string;
    description: string;
  }>;
  confidenceScore: number;
  warnings: string[];
  reactTailwind: {
    appTsx: string;
    components: Record<string, string>;
  };
  htmlCss: {
    indexHtml: string;
    stylesCss: string;
    scriptJs: string;
  };
}

export interface GeminiRefinementResponse {
  summary: string;
  warnings: string[];
  reactTailwind: {
    appTsx: string;
    components: Record<string, string>;
  };
  htmlCss: {
    indexHtml: string;
    stylesCss: string;
    scriptJs: string;
  };
}

export async function convertSketchWithGemini(
  base64ImageWithHeader: string,
  outputMode: "react-tailwind" | "html-css" | "all" = "all"
): Promise<GeminiConversionResponse> {
  if (!isGeminiConfigured()) {
    console.warn("Gemini API Key is missing. Returning mock code for demo mode.");
    return getMockConversionData();
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const systemPrompt = `You are BlueprintAI, an expert frontend engineer and UI reconstruction agent.
Your first priority is faithful reconstruction of the uploaded hand-drawn wireframe/sketch.
Analyze the image and preserve the visible layout, content zones, relative proportions, hierarchy, labels, and page structure before applying any visual polish.

Core reconstruction rules:
- Preserve drawn zones exactly when visible: logo/header, horizontal navigation, main article/content column, right sidebar, blog/news cards, RSS widgets, search box, privacy/disclaimer links, contact/footer information, thumbnails, section dividers, and gutters.
- Match proportions from the sketch. For a classic two-column corporate/blog page, use a centered page shell with the main content around 65% width and the sidebar around 30% width on desktop, with clear gutters and a stacked single-column layout on mobile.
- Use legible sketch text when present. For the Coastal Capital-style sketch, preserve labels such as Coastal Capital, Coastal Capital Partners, Capital Weblog, RSS feeds, Search Our Site, Privacy Policy, Disclaimer, contact details, and footer/copyright-style text.
- Treat handwritten annotations as requirements, not decorative notes. If arrows label a logo, nav, blog post text, RSS feeds, search, copyright/contact info, or privacy/disclaimer links, render those features.
- Do not simplify away visible modules. If the sketch shows three blog cards, an RSS box, a search box, a privacy box, and footer/contact/legal rows, generate all of them in the same relative order.
- For old corporate/blog wireframes, use this layout recipe unless the sketch clearly differs: compact brand header, a thin horizontal navigation strip directly under or beside it, main content card/column on the left, sidebar widget stack on the right, legal/contact footer at the bottom, and a subtle top-right vignette/feature panel only if drawn.
- Keep the page compact and editorial. Avoid excessive whitespace, huge centered marketing sections, giant hero imagery, floating decorative triangles, or full-bleed app-style sections when the drawing is a boxed webpage.
- Do not turn every sketch into a generic SaaS landing page. Avoid oversized hero sections, decorative glass-card marketing layouts, and unrelated app-product copy unless the sketch clearly asks for that structure.
- Prefer restrained, professional, corporate styling: clean spacing, readable typography, subtle borders, neutral backgrounds, modest accent colors, and clear information hierarchy.
- If the sketch is rough, keep the structure faithful and fill unclear copy with realistic placeholder text that matches the subject matter.

Asset and image rules:
- Do not generate broken external image URLs.
- Do not use random remote images, Unsplash URLs, placeholder.com URLs, empty image src attributes, or asset paths that are not included in the returned files.
- For sketch-indicated photos, thumbnails, logos, or vignettes when no real image is provided, render styled placeholder panels with CSS gradients, borders, simple icon-like shapes, or inline decorative blocks and descriptive alt text nearby.
- Make placeholders look intentional and proportional to the sketch: small blog thumbnails stay small, main article images stay inside the article column, and top-right vignettes stay in the header area rather than becoming unrelated page decoration.
- HTML/CSS output must be self-contained and must render without missing external image assets.

For React output:
- Use standard React 19 / TypeScript / TSX.
- Use Tailwind CSS for styling, but make the styling serve the sketch instead of overpowering it.
- Prefer a single App.tsx file for simpler sketches. Use optional component files only when it improves clarity.
- Component import consistency is mandatory: if App.tsx imports ./components/HeroSection, the components object must include a matching "components/HeroSection.tsx" file. The same rule applies to every relative component import.
- Do not import files that are not present in the JSON components map.
- If you are unsure whether you can return every component file, keep the React output fully self-contained in App.tsx with no relative component imports.
- Generated React must be preview-safe in Sandpack.
For HTML/CSS output:
- Generate a single index.html using semantic tags.
- Generate a matching styles.css and a script.js.
- Ensure the preview is standalone and fully functional without missing files.

Do not hallucinate complex backend features. If text is unclear, use realistic, professional placeholder text.
You MUST return ONLY valid JSON matching this exact JSON schema:
{
  "title": "string",
  "layoutDescription": "string",
  "detectedComponents": [
    {
      "type": "navbar | hero | card | button | form | input | grid | footer | image | sidebar | table | other",
      "label": "string",
      "description": "string"
    }
  ],
  "confidenceScore": 0.0,
  "warnings": ["string"],
  "reactTailwind": {
    "appTsx": "string",
    "components": {
      "ComponentName.tsx": "string"
    }
  },
  "htmlCss": {
    "indexHtml": "string",
    "stylesCss": "string",
    "scriptJs": "string"
  }
}
Return only the raw JSON. Do not include markdown code block syntax (like \`\`\`json).`;

  const genAI = new GoogleGenerativeAI(apiKey!);

  const matches = base64ImageWithHeader.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (!matches) {
    throw new Error("Invalid base64 image format");
  }
  const mimeType = matches[1];
  const base64Data = matches[2];

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };

  const modelCandidates = getModelCandidates(modelName);
  let lastError: unknown = null;

  for (const candidateModel of modelCandidates) {
    const model = genAI.getGenerativeModel({
      model: candidateModel,
      systemInstruction: systemPrompt,
    });

    const maxAttempts = candidateModel === modelName ? 3 : 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                imagePart,
                {
                  text: `Reconstruct this exact sketch as a working web page. Preserve the visible modules, proportions, labels, and sidebar/footer order from the drawing. Generate ${outputMode} output while following the JSON schema exactly.`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
          }
        });

        const responseText = result.response.text();
        if (!responseText) {
          throw new Error(`Gemini model ${candidateModel} returned an empty response.`);
        }

        const parsedData = JSON.parse(responseText.trim());
        return parsedData as GeminiConversionResponse;
      } catch (error: unknown) {
        lastError = error;
        const message = getGeminiErrorMessage(error);
        console.error(`Gemini model ${candidateModel} attempt ${attempt} failed:`, message);

        if (!isRetryableGeminiError(error)) {
          throw new Error(message || "Failed to analyze sketch with Gemini Developer API.");
        }

        if (attempt < maxAttempts) {
          await sleep(800 * attempt);
        }
      }
    }
  }

  const triedModels = modelCandidates.join(", ");
  const lastMessage = getGeminiErrorMessage(lastError);
  throw new Error(
    `Gemini is busy or temporarily unavailable after trying ${triedModels}. Please try again in a minute. Last error: ${lastMessage}`
  );
}

export async function refineGeneratedWebsiteWithGemini(input: {
  instruction: string;
  outputMode: "react-tailwind" | "html-css";
  generatedReactCode: string;
  generatedHtmlCode: string;
  generatedCssCode: string;
  generatedJsCode: string;
  generatedFiles: Record<string, string>;
}): Promise<GeminiRefinementResponse> {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key is missing. Add GEMINI_API_KEY before using AI edits.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey!);

  const systemPrompt = `You are BlueprintAI's in-workbench code editor.
The user already has a generated website. Apply only the requested changes to the existing code and preserve everything else.

Rules:
- Return complete updated code, not a diff.
- Keep the current framework mode working: React/Tailwind for react-tailwind, or standalone HTML/CSS/JS for html-css.
- React output must be Sandpack-safe TypeScript TSX.
- Do not import missing files. If App.tsx imports a component, include the matching component file in the components object.
- Prefer fewer React component files unless the current code already uses them.
- If you cannot preserve every imported component file, inline the component into App.tsx and remove the relative import.
- Do not add broken external image URLs or empty image src attributes.
- For visual changes such as size, spacing, color, alignment, layout, or copy, update classes/styles directly.
- Preserve the current website structure unless the user explicitly asks to restructure it.
- If the user asks for something unsafe or impossible, make the closest safe UI/code change and mention it in warnings.

You MUST return ONLY valid JSON matching this schema:
{
  "summary": "short plain-English summary of what changed",
  "warnings": ["string"],
  "reactTailwind": {
    "appTsx": "string",
    "components": {
      "ComponentName.tsx": "string"
    }
  },
  "htmlCss": {
    "indexHtml": "string",
    "stylesCss": "string",
    "scriptJs": "string"
  }
}
Return only raw JSON. Do not include markdown code block syntax.`;

  const userText = `Apply this user instruction to the generated website:
${input.instruction}

Current output mode: ${input.outputMode}

Current React App.tsx:
${input.generatedReactCode || ""}

Current React component files JSON:
${JSON.stringify(input.generatedFiles || {}, null, 2)}

Current HTML:
${input.generatedHtmlCode || ""}

Current CSS:
${input.generatedCssCode || ""}

Current JS:
${input.generatedJsCode || ""}

Return updated complete code for both reactTailwind and htmlCss. If a mode is not being edited, preserve its current code exactly.`;

  const modelCandidates = getModelCandidates(modelName);
  let lastError: unknown = null;

  for (const candidateModel of modelCandidates) {
    const model = genAI.getGenerativeModel({
      model: candidateModel,
      systemInstruction: systemPrompt,
    });

    const maxAttempts = candidateModel === modelName ? 3 : 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: userText }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

        const responseText = result.response.text();
        if (!responseText) {
          throw new Error(`Gemini model ${candidateModel} returned an empty response.`);
        }

        const parsedData = JSON.parse(responseText.trim()) as GeminiRefinementResponse;

        return {
          summary: parsedData.summary || "Applied the requested website changes.",
          warnings: parsedData.warnings || [],
          reactTailwind: {
            appTsx: parsedData.reactTailwind?.appTsx ?? input.generatedReactCode,
            components: parsedData.reactTailwind?.components ?? input.generatedFiles ?? {},
          },
          htmlCss: {
            indexHtml: parsedData.htmlCss?.indexHtml ?? input.generatedHtmlCode,
            stylesCss: parsedData.htmlCss?.stylesCss ?? input.generatedCssCode,
            scriptJs: parsedData.htmlCss?.scriptJs ?? input.generatedJsCode,
          },
        };
      } catch (error: unknown) {
        lastError = error;
        const message = getGeminiErrorMessage(error);
        console.error(`Gemini refine model ${candidateModel} attempt ${attempt} failed:`, message);

        if (!isRetryableGeminiError(error)) {
          throw new Error(message || "Failed to edit generated website with Gemini.");
        }

        if (attempt < maxAttempts) {
          await sleep(800 * attempt);
        }
      }
    }
  }

  const triedModels = modelCandidates.join(", ");
  const lastMessage = getGeminiErrorMessage(lastError);
  throw new Error(
    `Gemini is busy or temporarily unavailable after trying ${triedModels}. Please try again in a minute. Last error: ${lastMessage}`
  );
}

function getMockConversionData(): GeminiConversionResponse {
  const mockReactApp = `import React, { useState } from 'react';
// Import mock icons
import { Sparkles, Layout, Code, Eye, Cloud, ShieldAlert, FileJson, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSuccess(true);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#030712]/80 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-xl">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              BlueprintAI
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>
          <div>
            <button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all">
              Launch App
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center relative">
        <span className="px-3 py-1 text-xs font-semibold tracking-wider text-blue-400 uppercase bg-blue-500/10 border border-blue-500/20 rounded-full">
          ✨ Sketch to Web Conversion
        </span>
        <h1 className="mt-8 text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
          Turn Hand-Drawn Sketches <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Into Production Code
          </span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Upload a picture of your wireframe drawn on paper or whiteboard. Let our Gemini AI vision system compile it into clean React & Tailwind components instantly.
        </p>

        {/* Call to Action */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full max-w-md gap-2 bg-gray-900/60 p-2 rounded-2xl border border-gray-800 backdrop-blur-sm">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email to join the waitlist..."
              required
              className="bg-transparent border-0 ring-0 outline-none flex-1 text-sm text-gray-200 px-3 py-2 placeholder-gray-500"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {success && (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-400 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" /> Success! You have been added to our waitlist.
          </div>
        )}
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-900">
        <h2 className="text-3xl font-bold text-center text-white mb-16">
          Equipped with Premium Capabilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-2xl hover:border-gray-700 transition-colors">
            <div className="bg-blue-500/10 p-3 rounded-xl w-fit text-blue-400">
              <Layout className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">AI Vision Processing</h3>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              Detects layout grids, headers, sidebars, buttons, form fields, images, and tables directly from a physical drawing.
            </p>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-2xl hover:border-gray-700 transition-colors">
            <div className="bg-indigo-500/10 p-3 rounded-xl w-fit text-indigo-400">
              <Code className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">Dual Framework Output</h3>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              Switch seamlessly between a modern React + Tailwind CSS layout or modular standalone HTML/CSS/JS code.
            </p>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-2xl hover:border-gray-700 transition-colors">
            <div className="bg-cyan-500/10 p-3 rounded-xl w-fit text-cyan-400">
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">Live Sandpack Sandbox</h3>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              Test and edit generated code inside an active browser preview frame with hot-reloading rendering immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-900 text-center text-sm text-gray-500">
        <p>© 2026 BlueprintAI. Built for Academic Presentation & Web Engineering Lab Submission.</p>
      </footer>
    </div>
  );
}`;

  const mockHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BlueprintAI Demo Landing Page</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>
  
  <header>
    <div class="logo">
      <i class="fa-solid fa-wand-magic-sparkles"></i>
      <span>BlueprintAI</span>
    </div>
    <nav>
      <a href="#features">Features</a>
      <a href="#workflow">How it Works</a>
    </nav>
    <button class="cta-btn">Launch App</button>
  </header>

  <main>
    <section class="hero">
      <span class="badge">AI Sketch-to-Code Platform</span>
      <h1>Turn Hand-Drawn Sketches<br><span class="accent">Into Production Code</span></h1>
      <p>Upload a photograph of your wireframe and compile it instantly into HTML, CSS, and React code.</p>
      
      <div class="waitlist-form">
        <input type="email" placeholder="Enter your email for early access...">
        <button id="notifyBtn">Get Started <i class="fa-solid fa-arrow-right"></i></button>
      </div>
      <p id="successMsg" class="success-msg hide">Thanks! We've added you to the waitlist.</p>
    </section>

    <section id="features">
      <h2>Platform Features</h2>
      <div class="grid">
        <div class="card">
          <i class="fa-solid fa-eye card-icon"></i>
          <h3>AI Layout Detection</h3>
          <p>Scans images and extracts components like headers, footers, buttons, inputs, and cards.</p>
        </div>
        <div class="card">
          <i class="fa-solid fa-code card-icon"></i>
          <h3>Clean Code Output</h3>
          <p>Compiles structured HTML with modular CSS, ready for drop-in deployment.</p>
        </div>
        <div class="card">
          <i class="fa-solid fa-bolt card-icon"></i>
          <h3>Live Sandbox</h3>
          <p>Inspect code and make updates with instant browser rendering.</p>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <p>&copy; 2026 BlueprintAI. Built for Academic Presentation.</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>`;

  const mockCss = `body {
  margin: 0;
  padding: 0;
  background-color: #030712;
  color: #f3f4f6;
  font-family: system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
  position: relative;
  min-height: 100vh;
}

.glow-1 {
  position: absolute;
  top: 0;
  left: 20%;
  width: 400px;
  height: 400px;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
}

.glow-2 {
  position: absolute;
  top: 30%;
  right: 20%;
  width: 400px;
  height: 400px;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
}

header {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1f2937;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 1.25rem;
}

.logo i {
  color: #3b82f6;
}

nav {
  display: flex;
  gap: 30px;
}

nav a {
  color: #9ca3af;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}

nav a:hover {
  color: #fff;
}

.cta-btn {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
  transition: all 0.2s;
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(59, 130, 246, 0.3);
}

.hero {
  max-width: 800px;
  margin: 80px auto;
  text-align: center;
  padding: 0 20px;
}

.badge {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 6px 16px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
}

h1 {
  font-size: 3.5rem;
  margin: 30px 0 20px;
  font-weight: 850;
  line-height: 1.15;
}

.accent {
  background: linear-gradient(to right, #60a5fa, #818cf8, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: #9ca3af;
  font-size: 1.1rem;
  line-height: 1.6;
}

.waitlist-form {
  display: flex;
  background: rgba(17, 24, 39, 0.6);
  border: 1px solid #1f2937;
  padding: 8px;
  border-radius: 16px;
  max-width: 500px;
  margin: 40px auto 20px;
  backdrop-filter: blur(10px);
}

.waitlist-form input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  padding: 10px 15px;
  font-size: 0.95rem;
}

.waitlist-form button {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

#features {
  max-width: 1000px;
  margin: 120px auto 60px;
  padding: 0 20px;
}

#features h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 50px;
}

.grid {
  display: grid;
  grid-template-cols: repeat(3, 1fr);
  gap: 30px;
}

.card {
  background: rgba(17, 24, 39, 0.4);
  border: 1px solid #1f2937;
  padding: 30px;
  border-radius: 20px;
  transition: border-color 0.2s;
}

.card:hover {
  border-color: #3b82f6;
}

.card-icon {
  font-size: 1.75rem;
  color: #60a5fa;
  margin-bottom: 20px;
}

.card h3 {
  font-size: 1.2rem;
  margin: 0 0 10px;
}

.card p {
  font-size: 0.9rem;
  margin: 0;
}

.success-msg {
  color: #34d399;
  font-weight: 500;
  font-size: 0.95rem;
}

.hide {
  display: none;
}

footer {
  text-align: center;
  padding: 40px;
  color: #4b5563;
  font-size: 0.85rem;
  border-top: 1px solid #1f2937;
  max-width: 1200px;
  margin: 80px auto 0;
}

@media (max-width: 768px) {
  .grid {
    grid-template-cols: 1fr;
  }
  h1 {
    font-size: 2.25rem;
  }
}`;

  const mockJs = `document.getElementById('notifyBtn')?.addEventListener('click', () => {
  const emailInput = document.querySelector('.waitlist-form input');
  const successMsg = document.getElementById('successMsg');
  if (emailInput && emailInput.value) {
    successMsg.classList.remove('hide');
    emailInput.value = '';
    setTimeout(() => {
      successMsg.classList.add('hide');
    }, 4000);
  }
});`;

  return {
    title: "SaaS Landing Page - BlueprintAI Preview",
    layoutDescription: "Header navbar, centered large hero section with email input, and a 3-column features grid.",
    detectedComponents: [
      { type: "navbar", label: "Navigation Header", description: "Top header containing the app logo, nav links, and a primary CTA button." },
      { type: "hero", label: "Hero Title & Description", description: "Large centered title and description introducing the sketch compilation platform." },
      { type: "form", label: "Waitlist Input Form", description: "Integrated input box and button for email waitlist submissions." },
      { type: "grid", label: "Three Column Feature Grid", description: "Displaying AI Vision, Dual Output, and Live Sandbox details." }
    ],
    confidenceScore: 0.95,
    warnings: [],
    reactTailwind: {
      appTsx: mockReactApp,
      components: {}
    },
    htmlCss: {
      indexHtml: mockHtml,
      stylesCss: mockCss,
      scriptJs: mockJs
    }
  };
}
