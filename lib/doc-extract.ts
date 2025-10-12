/**
 * Document text extraction utilities for Insights
 * Supports PDF, TXT, and DOCX formats
 */

export interface ExtractedDoc {
  source: string;
  content: string;
  pageCount?: number;
  type: string;
  size: number;
  error?: string;
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractFromPdf(
  file: File
): Promise<{ content: string; pageCount: number }> {
  // Dynamic import for pdf-parse - uses named export 'pdf'
  const { pdf } = await import("pdf-parse");
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const data = await pdf(buffer);
    return {
      content: data.text.trim(),
      pageCount: data.total,
    };
  } catch (error) {
    throw new Error(
      `PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractFromDocx(file: File): Promise<{ content: string }> {
  // Dynamic import for mammoth
  const mammoth = await import("mammoth");
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      content: result.value.trim(),
    };
  } catch (error) {
    throw new Error(
      `DOCX extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract text from plain text file
 */
async function extractFromTxt(file: File): Promise<{ content: string }> {
  try {
    const text = await file.text();
    return {
      content: text.trim(),
    };
  } catch (error) {
    throw new Error(
      `TXT extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Main extraction router based on file type
 */
export async function extractTextFromDocument(
  file: File
): Promise<ExtractedDoc> {
  const type = file.type || "";
  const name = file.name || "unknown";
  const size = file.size || 0;

  // Validate file size (max 30MB)
  const MAX_SIZE = 30 * 1024 * 1024; // 30MB
  if (size > MAX_SIZE) {
    return {
      source: name,
      content: "",
      type,
      size,
      error: `File too large (${(size / 1024 / 1024).toFixed(2)}MB). Max 30MB.`,
    };
  }

  // Validate file is not empty
  if (size === 0) {
    return {
      source: name,
      content: "",
      type,
      size,
      error: "File is empty",
    };
  }

  let extracted: { content: string; pageCount?: number };

  try {
    // Route by MIME type or extension
    if (type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
      extracted = await extractFromPdf(file);
    } else if (
      type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.toLowerCase().endsWith(".docx")
    ) {
      extracted = await extractFromDocx(file);
    } else if (
      type === "text/plain" ||
      name.toLowerCase().endsWith(".txt") ||
      name.toLowerCase().endsWith(".md")
    ) {
      extracted = await extractFromTxt(file);
    } else {
      // Unsupported type - try as text anyway
      try {
        extracted = await extractFromTxt(file);
      } catch {
        return {
          source: name,
          content: "",
          type,
          size,
          error: `Unsupported file type: ${type || "unknown"}. Supported: PDF, DOCX, TXT.`,
        };
      }
    }

    // Validate extracted content
    if (!extracted.content || extracted.content.length === 0) {
      return {
        source: name,
        content: "",
        type,
        size,
        pageCount: extracted.pageCount,
        error:
          "No text could be extracted. File may be scanned image or corrupted.",
      };
    }

    return {
      source: name,
      content: extracted.content,
      type,
      size,
      pageCount: extracted.pageCount,
    };
  } catch (error) {
    return {
      source: name,
      content: "",
      type,
      size,
      error: error instanceof Error ? error.message : "Unknown extraction error",
    };
  }
}

/**
 * Process multiple files and return extraction results
 */
export async function extractFromMultipleDocuments(
  files: File[]
): Promise<ExtractedDoc[]> {
  const results = await Promise.all(
    files.map((file) => extractTextFromDocument(file))
  );
  return results;
}
