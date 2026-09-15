/**
 * In-Browser LSB Image Steganography (Hide & Reveal Secret Data in PNG Pixels)
 */

export async function hideMessageInImage(
  imageFile: File,
  secretText: string
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Header: 4 bytes length prefix
      const encoder = new TextEncoder();
      const textBytes = encoder.encode(secretText);
      const totalBytes = textBytes.length;

      if (totalBytes * 8 + 32 > data.length) {
        reject(new Error('Secret message is too long for this image dimensions!'));
        return;
      }

      // Encode 32-bit length prefix into first 32 pixels LSB
      for (let i = 0; i < 32; i++) {
        const bit = (totalBytes >> (31 - i)) & 1;
        data[i * 4] = (data[i * 4] & 0xfe) | bit;
      }

      // Encode text bytes
      let bitIdx = 32;
      for (let b = 0; b < textBytes.length; b++) {
        const byte = textBytes[b];
        for (let i = 0; i < 8; i++) {
          const bit = (byte >> (7 - i)) & 1;
          data[bitIdx * 4] = (data[bitIdx * 4] & 0xfe) | bit;
          bitIdx++;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Stego canvas blob failed'));
          return;
        }
        resolve({
          blob,
          dataUrl: URL.createObjectURL(blob),
        });
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for steganography'));
    };

    img.src = objectUrl;
  });
}

export async function revealMessageFromImage(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Read 32-bit length prefix
      let totalBytes = 0;
      for (let i = 0; i < 32; i++) {
        const bit = data[i * 4] & 1;
        totalBytes = (totalBytes << 1) | bit;
      }

      if (totalBytes <= 0 || totalBytes > 1000000) {
        reject(new Error('No valid hidden message detected in this image.'));
        return;
      }

      // Read bytes
      const resultBytes = new Uint8Array(totalBytes);
      let bitIdx = 32;
      for (let b = 0; b < totalBytes; b++) {
        let byte = 0;
        for (let i = 0; i < 8; i++) {
          const bit = data[bitIdx * 4] & 1;
          byte = (byte << 1) | bit;
          bitIdx++;
        }
        resultBytes[b] = byte;
      }

      const decoder = new TextDecoder();
      resolve(decoder.decode(resultBytes));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for extraction'));
    };

    img.src = objectUrl;
  });
}
