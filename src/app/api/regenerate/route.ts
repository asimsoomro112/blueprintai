import { NextRequest, NextResponse } from "next/server";
import { convertSketchWithGemini } from "@/lib/gemini";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversionId, imageBase64, imageUrl, outputMode, userId } = body;

    if (!conversionId) {
      return NextResponse.json(
        { success: false, error: "Conversion ID is required" },
        { status: 400 }
      );
    }

    const geminiResult = await convertSketchWithGemini(
      imageBase64 || imageUrl,
      outputMode || "all"
    );

    const updates = {
      title: geminiResult.title,
      detectedComponents: geminiResult.detectedComponents,
      layoutDescription: geminiResult.layoutDescription,
      generatedReactCode: geminiResult.reactTailwind?.appTsx || "",
      generatedHtmlCode: geminiResult.htmlCss?.indexHtml || "",
      generatedCssCode: geminiResult.htmlCss?.stylesCss || "",
      generatedJsCode: geminiResult.htmlCss?.scriptJs || "",
      generatedFiles: geminiResult.reactTailwind?.components || {},
      confidenceScore: geminiResult.confidenceScore,
      warnings: geminiResult.warnings,
      status: "completed" as const,
      updatedAt: new Date(),
    };

    if (isFirebaseAdminConfigured() && adminDb) {
      await adminDb.collection("conversions").doc(conversionId).update(updates);
    }

    return NextResponse.json({
      success: true,
      data: { id: conversionId, ...updates },
    });
  } catch (error: any) {
    console.error("Regenerate API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Regeneration failed" },
      { status: 500 }
    );
  }
}
