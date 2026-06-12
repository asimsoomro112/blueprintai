import { NextRequest, NextResponse } from "next/server";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { isGeminiConfigured } from "@/lib/gemini";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        firebaseAdmin: isFirebaseAdminConfigured(),
        cloudinary: isCloudinaryConfigured(),
        gemini: isGeminiConfigured(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to run diagnostics" },
      { status: 500 }
    );
  }
}

