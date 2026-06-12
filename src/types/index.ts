export interface ConversionRecord {
  id: string;
  userId: string;
  title: string;
  originalFileName: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  imageWidth: number;
  imageHeight: number;
  outputMode: "react-tailwind" | "html-css";
  detectedComponents: Array<{
    type: string;
    label: string;
    description: string;
  }>;
  layoutDescription: string;
  generatedReactCode: string;
  generatedHtmlCode: string;
  generatedCssCode: string;
  generatedJsCode: string;
  generatedFiles: Record<string, string>;
  status: "completed" | "failed" | "processing";
  confidenceScore: number;
  warnings: string[];
  createdAt: any;
  updatedAt: any;
}

export interface DashboardStats {
  totalConversions: number;
  successfulExports: number;
  thisMonthConversions: number;
  storageEstimate: string;
}
