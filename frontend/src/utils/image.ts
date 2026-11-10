export interface ParsedImageResult {
  url: string;
  isGoogleDrive: boolean;
  fileId?: string;
  originalUrl: string;
}

export function parseAndConvertImageUrl(rawUrl: string): ParsedImageResult {
  const originalUrl = (rawUrl || '').trim();
  if (!originalUrl) {
    return { url: '', isGoogleDrive: false, originalUrl: '' };
  }

  let fileId: string | undefined;

  const fileDMatch = originalUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    fileId = fileDMatch[1];
  }

  if (!fileId) {
    const idMatch = originalUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    }
  }

  if (!fileId && originalUrl.includes('googleusercontent.com/d/')) {
    const parts = originalUrl.split('googleusercontent.com/d/')[1];
    fileId = parts ? parts.split('?')[0].split('/')[0] : undefined;
  }

  if (fileId) {
    return {
      url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`,
      isGoogleDrive: true,
      fileId,
      originalUrl
    };
  }

  return {
    url: originalUrl,
    isGoogleDrive: false,
    originalUrl
  };
}

export function testImageLoad(url: string, isGoogleDrive: boolean): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!url) {
      resolve({ valid: false, error: 'Please enter an image URL.' });
      return;
    }

    if (url.startsWith('/uploads/')) {
      resolve({ valid: true });
      return;
    }

    const img = new Image();
    let timer: any = null;

    img.onload = () => {
      clearTimeout(timer);
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve({ valid: true });
      } else {
        resolve({
          valid: false,
          error: isGoogleDrive
            ? "Google Drive image is not publicly accessible. Please set General Access to Anyone with the link."
            : "The provided link does not appear to be a valid image."
        });
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve({
        valid: false,
        error: isGoogleDrive
          ? "Google Drive image is not publicly accessible. Please set General Access to Anyone with the link."
          : "Unable to load image from URL. Please verify the URL points to a public image file."
      });
    };

    timer = setTimeout(() => {
      img.src = '';
      resolve({
        valid: false,
        error: isGoogleDrive
          ? "Google Drive image is not publicly accessible. Please set General Access to Anyone with the link."
          : "Image load timed out. Please check the image URL."
      });
    }, 8000);

    img.src = url;
  });
}
