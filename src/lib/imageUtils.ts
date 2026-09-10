/**
 * FitMed Image Processing & Cloudinary Upload Utility
 * Converts any image format (JPG, PNG, HEIC, etc.) to WebP in browser before uploading to Cloudinary.
 */

export interface WebPConversionResult {
  file: File;
  dataUrl: string;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  dimensions: { width: number; height: number };
}

/**
 * Converts a File object to an optimized WebP image via HTML5 Canvas
 * @param file Input file (PNG, JPG, BMP, etc.)
 * @param quality WebP quality 0.1 to 1.0 (default: 0.85)
 * @param maxDim Maximum width or height constraint (default: 1000px)
 */
export async function convertToWebP(
  file: File,
  quality = 0.85,
  maxDim = 1000
): Promise<WebPConversionResult> {
  return new Promise((resolve, reject) => {
    // If already webp and small, still normalize dimensions
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down while maintaining aspect ratio
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D canvas context"));
          return;
        }

        // Fill white background for transparent PNGs before webp conversion
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP Data URL & Blob
        const dataUrl = canvas.toDataURL("image/webp", quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("WebP conversion failed"));
              return;
            }

            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const webpFile = new File([blob], `${baseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const originalSize = file.size;
            const compressedSize = blob.size;
            const reductionPercentage = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            resolve({
              file: webpFile,
              dataUrl,
              blob,
              originalSize,
              compressedSize,
              reductionPercentage,
              dimensions: { width, height },
            });
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load source image into DOM"));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a WebP image to Cloudinary
 * Calls our secure server-side `/api/upload` endpoint or directly uploads using an unsigned preset.
 */
export function isCloudinaryUrl(url?: string) {
  const value = String(url || "").trim();
  return /^https:\/\/res\.cloudinary\.com\//i.test(value);
}

export async function uploadToCloudinary(
  fileOrDataUrl: File | Blob | string,
  folder = "fitmed/profiles"
): Promise<{ url: string; publicId: string; format: string; error?: string }> {
  // 1. Direct signed Cloudinary upload (bypasses reverse proxy body size limits & 413 errors)
  try {
    const signRes = await fetch(`/api/upload/sign?folder=${encodeURIComponent(folder)}`, {
      credentials: "include",
    });
    if (signRes.ok) {
      const signData = await signRes.json();
      if (signData.signature && signData.apiKey && signData.cloudName) {
        const directForm = new FormData();
        if (typeof fileOrDataUrl === "string") {
          directForm.append("file", fileOrDataUrl);
        } else {
          const fileName =
            fileOrDataUrl instanceof File && fileOrDataUrl.name
              ? fileOrDataUrl.name
              : "document";
          directForm.append("file", fileOrDataUrl, fileName);
        }
        directForm.append("api_key", signData.apiKey);
        directForm.append("timestamp", String(signData.timestamp));
        directForm.append("signature", signData.signature);
        directForm.append("folder", signData.folder || folder);

        const uploadEndpoint = `https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`;
        const cRes = await fetch(uploadEndpoint, {
          method: "POST",
          body: directForm,
        });
        const cData = await cRes.json().catch(() => ({}));
        const directUrl = String(cData.secure_url || cData.url || "");
        if (cRes.ok && isCloudinaryUrl(directUrl)) {
          return {
            url: directUrl,
            publicId: cData.public_id || "",
            format: cData.format || "pdf",
          };
        }
        if (cData?.error?.message) {
          console.warn("Cloudinary direct upload message:", cData.error.message);
        }
      }
    }
  } catch (directErr) {
    console.warn("Direct Cloudinary upload failed, attempting fallback to /api/upload:", directErr);
  }

  // 2. Fallback to /api/upload
  try {
    const formData = new FormData();

    if (typeof fileOrDataUrl === "string") {
      formData.append("file", fileOrDataUrl);
    } else {
      const fileName =
        fileOrDataUrl instanceof File && fileOrDataUrl.name
          ? fileOrDataUrl.name
          : "profile.webp";
      formData.append("file", fileOrDataUrl, fileName);
    }
    formData.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    const url = String(data.url || "");
    if (!response.ok || !isCloudinaryUrl(url)) {
      const errorMsg =
        response.status === 413
          ? "File is too large for the server. Please compress or optimize the document."
          : (data.error || "Cloudinary did not store this file. Try again.");
      return {
        url: "",
        publicId: "",
        format: "webp",
        error: errorMsg,
      };
    }
    return {
      url,
      publicId: data.publicId || "",
      format: data.format || "webp",
    };
  } catch (err: any) {
    console.error("Upload error:", err);
    return {
      url: "",
      publicId: "",
      format: "webp",
      error: err?.message || "Could not reach upload server. Check your connection and try again.",
    };
  }
}

/**
 * Human-readable byte size formatter
 */
export function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
