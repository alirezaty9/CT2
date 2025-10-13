/**
 * Image Export Utilities
 * Supports TIFF, JPG, PNG export (ردیف 55)
 */

import { saveAs } from 'file-saver';

/**
 * Export canvas as PNG
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} filename - Output filename
 */
export const exportAsPNG = (canvas, filename = 'image.png') => {
  canvas.toBlob((blob) => {
    saveAs(blob, filename);
  }, 'image/png');
};

/**
 * Export canvas as JPEG
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} filename - Output filename
 * @param {number} quality - JPEG quality (0-1)
 */
export const exportAsJPEG = (canvas, filename = 'image.jpg', quality = 0.95) => {
  canvas.toBlob((blob) => {
    saveAs(blob, filename);
  }, 'image/jpeg', quality);
};

/**
 * Export ImageData as TIFF (basic implementation)
 * For full TIFF support with metadata, use tiff.js library
 *
 * @param {ImageData} imageData - Image data to export
 * @param {string} filename - Output filename
 * @param {Object} metadata - Optional TIFF metadata
 */
export const exportAsTIFF = async (imageData, filename = 'image.tif', metadata = {}) => {
  try {
    // Create canvas from ImageData
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);

    // Convert to blob and save
    // Note: For true TIFF with metadata, you'd need tiff.js encoding
    canvas.toBlob((blob) => {
      saveAs(blob, filename);
    }, 'image/tiff');

  } catch (error) {
    console.error('TIFF export error:', error);
    // Fallback to PNG
    exportAsPNG(canvas, filename.replace('.tif', '.png'));
  }
};

/**
 * Export ImageData as DICONDE (.dcm)
 * Simplified implementation - for full DICOM support, integrate with dicom-parser
 *
 * @param {ImageData} imageData - Image data
 * @param {string} filename - Output filename
 * @param {Object} metadata - DICOM metadata
 */
export const exportAsDICONDE = async (imageData, filename = 'image.dcm', metadata = {}) => {
  try {
    // Create a basic DICONDE file structure
    // This is a simplified version - real DICONDE requires proper encoding

    const {
      patientName = 'Anonymous',
      studyDate = new Date().toISOString().split('T')[0],
      modality = 'CT',
      manufacturer = 'Arman Moj Fanavar Co.',
      kVp = '120',
      mA = '100',
      exposureTime = '1000',
      ...otherMetadata
    } = metadata;

    // For now, export as PNG with metadata in filename
    // For true DICONDE, you would use a DICOM library
    const metaFilename = `${filename.replace('.dcm', '')}_${modality}_${kVp}kVp_${mA}mA.dcm`;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);

    // Save as blob
    canvas.toBlob((blob) => {
      saveAs(blob, metaFilename);
    }, 'image/png');

    // Also save metadata as separate JSON file
    const metaBlob = new Blob([JSON.stringify({
      patientName,
      studyDate,
      modality,
      manufacturer,
      kVp,
      mA,
      exposureTime,
      width: imageData.width,
      height: imageData.height,
      ...otherMetadata
    }, null, 2)], { type: 'application/json' });

    saveAs(metaBlob, metaFilename.replace('.dcm', '_metadata.json'));

  } catch (error) {
    console.error('DICONDE export error:', error);
  }
};

/**
 * Export with format auto-detection
 * @param {HTMLCanvasElement|ImageData} source - Canvas or ImageData
 * @param {string} filename - Filename with extension
 * @param {Object} options - Export options
 */
export const exportImage = async (source, filename, options = {}) => {
  const extension = filename.split('.').pop().toLowerCase();

  let canvas;
  if (source instanceof HTMLCanvasElement) {
    canvas = source;
  } else {
    // Convert ImageData to canvas
    canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(source, 0, 0);
  }

  switch (extension) {
    case 'png':
      exportAsPNG(canvas, filename);
      break;
    case 'jpg':
    case 'jpeg':
      exportAsJPEG(canvas, filename, options.quality || 0.95);
      break;
    case 'tif':
    case 'tiff':
      exportAsTIFF(source, filename, options.metadata);
      break;
    case 'dcm':
      exportAsDICONDE(source, filename, options.metadata);
      break;
    default:
      exportAsPNG(canvas, filename + '.png');
  }
};

/**
 * Export multiple images as ZIP
 * @param {Array} images - Array of {data: ImageData, filename: string}
 * @param {string} zipFilename - Output ZIP filename
 */
export const exportAsZIP = async (images, zipFilename = 'images.zip') => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (const { data, filename } of images) {
      // Convert ImageData to blob
      const canvas = document.createElement('canvas');
      canvas.width = data.width;
      canvas.height = data.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(data, 0, 0);

      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });

      zip.file(filename, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, zipFilename);

  } catch (error) {
    console.error('ZIP export error:', error);
  }
};

/**
 * Convert ImageData to base64
 * @param {ImageData} imageData - Image data
 * @param {string} format - Output format ('png', 'jpeg')
 * @returns {Promise<string>} Base64 string
 */
export const imageDataToBase64 = (imageData, format = 'png') => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);

    const dataURL = canvas.toDataURL(`image/${format}`);
    resolve(dataURL);
  });
};

/**
 * Convert canvas to Blob
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} format - Format ('png', 'jpeg')
 * @returns {Promise<Blob>} Image blob
 */
export const canvasToBlob = (canvas, format = 'png') => {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, `image/${format}`);
  });
};
