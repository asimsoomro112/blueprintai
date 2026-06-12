import crypto from "crypto";

export const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_CLOUD_NAME.includes("your_")
  );
};

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

export async function uploadToCloudinary(
  base64Image: string
): Promise<CloudinaryUploadResponse> {
  if (!isCloudinaryConfigured()) {
    // Fallback Mock Response for Demo Mode
    console.warn("Cloudinary not configured. Returning simulated mock upload.");
    return {
      secure_url: base64Image,
      public_id: "mock_cloudinary_public_id",
      width: 600,
      height: 400,
    };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "blueprintai-sketches";

  const timestamp = Math.round(new Date().getTime() / 1000).toString();

  // Create signature alphabetically: folder, timestamp
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signatureString = `${paramsToSign}${apiSecret}`;

  const signature = crypto
    .createHash("sha1")
    .update(signatureString)
    .digest("hex");

  // Send signed request
  const formData = new URLSearchParams();
  formData.append("file", base64Image);
  formData.append("folder", folder);
  formData.append("timestamp", timestamp);
  formData.append("api_key", apiKey!);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to upload image. Cloudinary returned status ${response.status}`
    );
  }

  const data = await response.json();

  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    width: data.width,
    height: data.height,
  };
}

