import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image data provided" },
        { status: 400 }
      );
    }

    // Validate base64 format
    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        { success: false, error: "Invalid image format. Must be base64 data URI." },
        { status: 400 }
      );
    }

    // Size check (~5MB base64 ≈ ~6.6M chars)
    if (image.length > 7_000_000) {
      return NextResponse.json(
        { success: false, error: "Image is too large. Max 5MB allowed." },
        { status: 400 }
      );
    }

    const result = await uploadToCloudinary(image);

    return NextResponse.json({
      success: true,
      data: {
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}

