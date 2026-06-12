import { NextRequest, NextResponse } from "next/server";
import { refineGeneratedWebsiteWithGemini } from "@/lib/gemini";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conversionId,
      instruction,
      outputMode,
      generatedReactCode,
      generatedHtmlCode,
      generatedCssCode,
      generatedJsCode,
      generatedFiles,
    } = body;

    if (!conversionId) {
      return NextResponse.json(
        { success: false, error: "Conversion ID is required" },
        { status: 400 }
      );
    }

    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
      return NextResponse.json(
        { success: false, error: "Tell the AI what you want to change." },
        { status: 400 }
      );
    }

    const mode = outputMode === "html-css" ? "html-css" : "react-tailwind";
    const result = await refineGeneratedWebsiteWithGemini({
      instruction: instruction.trim(),
      outputMode: mode,
      generatedReactCode: generatedReactCode || "",
      generatedHtmlCode: generatedHtmlCode || "",
      generatedCssCode: generatedCssCode || "",
      generatedJsCode: generatedJsCode || "",
      generatedFiles: generatedFiles || {},
    });

    const updates = {
      generatedReactCode: result.reactTailwind.appTsx,
      generatedHtmlCode: result.htmlCss.indexHtml,
      generatedCssCode: result.htmlCss.stylesCss,
      generatedJsCode: result.htmlCss.scriptJs,
      generatedFiles: result.reactTailwind.components || {},
      warnings: result.warnings || [],
      updatedAt: new Date(),
    };

    if (isFirebaseAdminConfigured() && adminDb && !String(conversionId).startsWith("local-")) {
      await adminDb.collection("conversions").doc(conversionId).update(updates);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: conversionId,
        summary: result.summary,
        ...updates,
      },
    });
  } catch (error: any) {
    console.error("Refine API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "AI edit failed" },
      { status: 500 }
    );
  }
}
