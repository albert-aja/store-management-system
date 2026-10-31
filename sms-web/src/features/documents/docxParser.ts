import mammoth from "mammoth";

export interface DocxConversionResult {
  html: string;
  messages: string[];
  isSuccess: boolean;
  error?: string;
}

export async function convertDocxToHtml(data: ArrayBuffer | Blob): Promise<DocxConversionResult> {
  try {
    const arrayBuffer = data instanceof Blob ? await data.arrayBuffer() : data;
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return {
      html: result.value || "<p><em>(Empty document)</em></p>",
      messages: result.messages.map((m) => m.message),
      isSuccess: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to parse Word document";
    return {
      html: "",
      messages: [],
      isSuccess: false,
      error: message,
    };
  }
}
