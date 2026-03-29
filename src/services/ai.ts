/**
 * Simulated AI Document Analysis module.
 * In production, this could use a real ML model or API for document analysis.
 */

export type AIVerdict = "authentic" | "suspicious";

export interface AIAnalysisResult {
  verdict: AIVerdict;
  confidence: number;
  findings: string[];
  analysisTime: number;
  metadata: {
    fileType: string;
    fileSize: number;
    pagesEstimated: number;
  };
}

export async function analyzeDocument(file: File): Promise<AIAnalysisResult> {
  const startTime = Date.now();

  // Simulate AI processing (1.5-3s)
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));

  const isPdf = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");

  // Simulate analysis — mostly authentic, occasionally suspicious for demo
  const suspiciousChance = Math.random();
  const isAuthentic = suspiciousChance > 0.15;

  const authenticFindings = [
    "Document structure integrity verified",
    "No metadata inconsistencies detected",
    "File encoding patterns normal",
    "Creation timestamp consistent",
    "No signs of digital manipulation",
  ];

  const suspiciousFindings = [
    "Metadata timestamp inconsistency detected",
    "Unusual byte patterns in header",
    "Possible modification signature found",
    "Encoding anomalies in document stream",
  ];

  return {
    verdict: isAuthentic ? "authentic" : "suspicious",
    confidence: isAuthentic
      ? 0.85 + Math.random() * 0.14
      : 0.6 + Math.random() * 0.25,
    findings: isAuthentic
      ? authenticFindings.slice(0, 3 + Math.floor(Math.random() * 2))
      : suspiciousFindings.slice(0, 2 + Math.floor(Math.random() * 2)),
    analysisTime: Date.now() - startTime,
    metadata: {
      fileType: isPdf ? "PDF" : isImage ? "Image" : "Document",
      fileSize: file.size,
      pagesEstimated: isPdf ? Math.max(1, Math.floor(file.size / 50000)) : 1,
    },
  };
}
