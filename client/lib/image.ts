export async function resizeImageFile(
  file: File,
  maxSize = 512,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        let { width, height } = img;
        const ratio = width / height;
        if (width > height) {
          if (width > maxSize) {
            width = maxSize;
            height = Math.round(maxSize / ratio);
          }
        } else {
          if (height > maxSize) {
            height = maxSize;
            width = Math.round(maxSize * ratio);
          }
        }
        canvas.width = width;
        canvas.height = height;
        // draw with white background to avoid transparency issues
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const dataUrl = canvas.toDataURL("image/webp", 0.85);
          resolve(dataUrl);
        } catch (e) {
          try {
            resolve(canvas.toDataURL("image/png"));
          } catch (er) {
            reject(er);
          }
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
