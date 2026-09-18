import { toBlob } from "html-to-image";

interface CopyImageResult {
  success: boolean;
  error?: string;
}

export async function copyNodeAsImageToClipboard(
  node: HTMLElement,
  options?: { pixelRatio?: number; fileNameFallback?: string }
): Promise<CopyImageResult> {
  const pixelRatio = options?.pixelRatio || 2; // Crisp resolution for Retina/Mobile displays
  const fileName = options?.fileNameFallback || "connect-card.png";

  try {
    const blob = await toBlob(node, {
      pixelRatio,
      cacheBust: true,
      backgroundColor: "#FFFFFF",
    });

    if (!blob) {
      return { success: false, error: "Failed to generate image from element." };
    }

    // Check if ClipboardItem & binary write are supported (Secure context required)
    if (navigator.clipboard && typeof window.ClipboardItem !== "undefined") {
      try {
        const clipboardItem = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([clipboardItem]);
        return { success: true };
      } catch (clipErr) {
        console.warn("Direct clipboard write failed, falling back to download:", clipErr);
      }
    }

    // Mobile / Fallback: trigger file download if clipboard binary write is restricted
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (err: any) {
    console.error("Error capturing card:", err);
    return { success: false, error: err.message || "Unable to capture image." };
  }
}