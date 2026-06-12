import { NextRequest, NextResponse } from "next/server";
import { convertSketchWithGemini } from "@/lib/gemini";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, imageUrl, outputMode, userId, fileName, cloudinaryPublicId } = body;

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { success: false, error: "No image data provided" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 401 }
      );
    }

    // Rate limit check: max 10 conversions per day
    if (isFirebaseAdminConfigured() && adminDb) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const snapshot = await adminDb
        .collection("conversions")
        .where("userId", "==", userId)
        .get();

      const todayConversions = snapshot.docs.filter((doc) => {
        const data = doc.data();
        if (!data.createdAt) return false;
        const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        return date >= today;
      });

      if (todayConversions.length >= 10) {
        return NextResponse.json(
          {
            success: false,
            error: "Daily limit reached. You can perform up to 10 conversions per day on the free tier.",
          },
          { status: 429 }
        );
      }
    }

    // Call Gemini
    const geminiResult = await convertSketchWithGemini(
      imageBase64 || imageUrl,
      outputMode || "all"
    );

    // Build conversion document
    const conversionData = {
      userId,
      title: geminiResult.title || "Untitled Conversion",
      originalFileName: fileName || "sketch.png",
      cloudinaryUrl: imageUrl || "",
      cloudinaryPublicId: cloudinaryPublicId || "",
      imageWidth: 0,
      imageHeight: 0,
      outputMode: outputMode || "react-tailwind",
      detectedComponents: geminiResult.detectedComponents,
      layoutDescription: geminiResult.layoutDescription,
      generatedReactCode: geminiResult.reactTailwind?.appTsx || "",
      generatedHtmlCode: geminiResult.htmlCss?.indexHtml || "",
      generatedCssCode: geminiResult.htmlCss?.stylesCss || "",
      generatedJsCode: geminiResult.htmlCss?.scriptJs || "",
      generatedFiles: geminiResult.reactTailwind?.components || {},
      status: "completed" as const,
      confidenceScore: geminiResult.confidenceScore,
      warnings: geminiResult.warnings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    let conversionId = `local-${Date.now()}`;
    if (isFirebaseAdminConfigured() && adminDb) {
      const docRef = await adminDb.collection("conversions").add(conversionData);
      conversionId = docRef.id;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: conversionId,
        ...conversionData,
      },
    });
  } catch (error: any) {
    console.error("Convert API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Conversion failed" },
      { status: 500 }
    );
  }
}

