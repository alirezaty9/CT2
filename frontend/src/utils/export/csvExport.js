/**
 * CSV Export Utilities
 * Enhanced CSV export with metadata support
 */

import Papa from 'papaparse';
import { saveAs } from 'file-saver';

/**
 * Export data to CSV
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Output filename
 * @param {Object} options - Papa Parse options
 */
export const exportToCSV = (data, filename = 'data.csv', options = {}) => {
  const csv = Papa.unparse(data, {
    header: true,
    ...options
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

/**
 * Export histogram data to CSV
 * @param {Array<number>} histogramData - Histogram array
 * @param {string} filename - Output filename
 * @param {Object} metadata - Additional metadata
 */
export const exportHistogramToCSV = (histogramData, filename = 'histogram.csv', metadata = {}) => {
  const data = histogramData.map((count, intensity) => ({
    intensity,
    count,
    percentage: (count / histogramData.reduce((a, b) => a + b, 0) * 100).toFixed(2)
  }));

  // Add metadata as header comments
  let csvContent = '';

  // Add metadata
  if (Object.keys(metadata).length > 0) {
    csvContent += '# Histogram Metadata\n';
    for (const [key, value] of Object.entries(metadata)) {
      csvContent += `# ${key}: ${value}\n`;
    }
    csvContent += '#\n';
  }

  // Add data
  csvContent += Papa.unparse(data, { header: true });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

/**
 * Export intensity profile to CSV
 * @param {Array<Object>} profileData - Profile data array
 * @param {string} filename - Output filename
 * @param {Object} metadata - Profile metadata
 */
export const exportIntensityProfileToCSV = (profileData, filename = 'intensity_profile.csv', metadata = {}) => {
  let csvContent = '';

  // Add metadata
  if (Object.keys(metadata).length > 0) {
    csvContent += '# Intensity Profile Metadata\n';
    for (const [key, value] of Object.entries(metadata)) {
      csvContent += `# ${key}: ${value}\n`;
    }
    csvContent += '#\n';
  }

  // Add profile data
  csvContent += Papa.unparse(profileData, { header: true });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

/**
 * Export ROI analysis to CSV
 * @param {Object} roiAnalysis - ROI analysis result
 * @param {string} filename - Output filename
 */
export const exportROIAnalysisToCSV = (roiAnalysis, filename = 'roi_analysis.csv') => {
  let csvContent = '';

  // Add ROI information
  csvContent += '# ROI Analysis Report\n';
  csvContent += `# Shape: ${roiAnalysis.shape}\n`;
  csvContent += `# Channel: ${roiAnalysis.channel}\n`;
  csvContent += `# Area: ${roiAnalysis.area} pixels\n`;
  csvContent += `# Pixel Count: ${roiAnalysis.pixelCount}\n`;
  csvContent += '#\n';

  // Add statistics
  csvContent += '# Statistics\n';
  const statsData = Object.entries(roiAnalysis.statistics).map(([key, value]) => ({
    metric: key,
    value: typeof value === 'number' ? value.toFixed(4) : value
  }));
  csvContent += Papa.unparse(statsData, { header: true });

  // Add metrics if available
  if (roiAnalysis.metrics) {
    csvContent += '\n\n# Image Quality Metrics\n';
    const metricsData = Object.entries(roiAnalysis.metrics).map(([key, value]) => ({
      metric: key,
      value: typeof value === 'number' ? value.toFixed(4) : value
    }));
    csvContent += Papa.unparse(metricsData, { header: true });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

/**
 * Export CT scan metadata (ردیف 75)
 * @param {Object} metadata - Complete scan metadata
 * @param {string} filename - Output filename
 */
export const exportCTMetadata = (metadata, filename = 'ct_metadata.txt') => {
  const {
    // Geometry
    SOD,
    SDD,
    magnification,
    pixelPitch,
    effectivePixelSize,
    coneBeamAngle,

    // X-Ray Parameters
    kVp,
    current,
    currentUnit,
    power,
    exposureTime,
    filtrationMaterial,
    filtrationThickness,

    // Detector
    detectorType,
    bitDepth,

    // Acquisition
    projectionNumbers,
    totalAngle,
    rotationAngle,
    totalScanTime,
    warmUp,

    // Processing
    imageFilters,
    reconstructionMethod,
    reconstructionFilter,

    // Other
    timestamp,
    operator,
    notes,
    ...otherParams
  } = metadata;

  let content = '';

  content += '='.repeat(60) + '\n';
  content += 'CT SCAN METADATA\n';
  content += '='.repeat(60) + '\n\n';

  // Geometry Parameters
  content += '--- GEOMETRY PARAMETERS ---\n';
  if (SOD !== undefined) content += `Source-Object Distance (SOD): ${SOD} mm\n`;
  if (SDD !== undefined) content += `Source-Detector Distance (SDD): ${SDD} mm\n`;
  if (magnification !== undefined) content += `Magnification: ${magnification}x\n`;
  if (pixelPitch !== undefined) content += `Pixel Pitch: ${pixelPitch} µm\n`;
  if (effectivePixelSize !== undefined) content += `Effective Pixel Size: ${effectivePixelSize} µm\n`;
  if (coneBeamAngle !== undefined) content += `Cone Beam Angle: ${coneBeamAngle}°\n`;
  content += '\n';

  // X-Ray Parameters
  content += '--- X-RAY PARAMETERS ---\n';
  if (kVp !== undefined) content += `Tube Voltage: ${kVp} kVp\n`;
  if (current !== undefined) content += `Anode Current: ${current} ${currentUnit || 'mA'}\n`;
  if (power !== undefined) content += `Power: ${power} W\n`;
  if (exposureTime !== undefined) content += `Exposure Time: ${exposureTime} ms\n`;
  if (filtrationMaterial !== undefined) {
    content += `Filtration: ${filtrationMaterial}`;
    if (filtrationThickness !== undefined) {
      content += ` (${filtrationThickness} mm)`;
    }
    content += '\n';
  }
  content += '\n';

  // Detector Parameters
  content += '--- DETECTOR PARAMETERS ---\n';
  if (detectorType !== undefined) content += `Detector Type: ${detectorType}\n`;
  if (bitDepth !== undefined) content += `Bit Depth: ${bitDepth}\n`;
  content += '\n';

  // Acquisition Parameters
  content += '--- ACQUISITION PARAMETERS ---\n';
  if (projectionNumbers !== undefined) content += `Number of Projections: ${projectionNumbers}\n`;
  if (totalAngle !== undefined) content += `Total Angle: ${totalAngle}° (${totalAngle === 360 ? 'Full' : 'Half'} rotation)\n`;
  if (rotationAngle !== undefined) content += `Rotation Angle Step: ${rotationAngle}°\n`;
  if (totalScanTime !== undefined) content += `Total Scan Time: ${totalScanTime} s\n`;
  if (warmUp !== undefined) content += `Warm-up/Seasoning: ${warmUp}\n`;
  content += '\n';

  // Processing Parameters
  content += '--- PROCESSING PARAMETERS ---\n';
  if (reconstructionMethod !== undefined) content += `Reconstruction Method: ${reconstructionMethod}\n`;
  if (reconstructionFilter !== undefined) content += `Reconstruction Filter: ${reconstructionFilter}\n`;
  if (imageFilters && Array.isArray(imageFilters)) {
    content += `Applied Filters: ${imageFilters.join(', ')}\n`;
  }
  content += '\n';

  // Additional Information
  content += '--- ADDITIONAL INFORMATION ---\n';
  if (timestamp !== undefined) content += `Timestamp: ${timestamp}\n`;
  if (operator !== undefined) content += `Operator: ${operator}\n`;
  if (notes !== undefined) content += `Notes: ${notes}\n`;

  // Other parameters
  if (Object.keys(otherParams).length > 0) {
    content += '\n--- OTHER PARAMETERS ---\n';
    for (const [key, value] of Object.entries(otherParams)) {
      content += `${key}: ${value}\n`;
    }
  }

  content += '\n' + '='.repeat(60) + '\n';
  content += 'Generated by CT Scanner Software\n';
  content += 'Arman Moj Fanavar Co.\n';
  content += '='.repeat(60) + '\n';

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  saveAs(blob, filename);
};

/**
 * Export project data (images + metadata + analysis)
 * @param {Object} projectData - Complete project data
 * @param {string} projectName - Project name
 */
export const exportProjectData = async (projectData, projectName = 'ct_project') => {
  const {
    images,
    metadata,
    histograms,
    profiles,
    roiAnalyses
  } = projectData;

  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Add metadata
    if (metadata) {
      const metaContent = JSON.stringify(metadata, null, 2);
      zip.file('metadata.json', metaContent);

      // Also add text version
      const metaText = Object.entries(metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      zip.file('metadata.txt', metaText);
    }

    // Add histograms
    if (histograms && histograms.length > 0) {
      const histFolder = zip.folder('histograms');
      histograms.forEach((hist, idx) => {
        const csv = exportHistogramToCSV(hist.data, `histogram_${idx}.csv`, hist.metadata);
        histFolder.file(`histogram_${idx}.csv`, csv);
      });
    }

    // Add profiles
    if (profiles && profiles.length > 0) {
      const profFolder = zip.folder('profiles');
      profiles.forEach((prof, idx) => {
        const csv = Papa.unparse(prof.data, { header: true });
        profFolder.file(`profile_${idx}.csv`, csv);
      });
    }

    // Add ROI analyses
    if (roiAnalyses && roiAnalyses.length > 0) {
      const roiFolder = zip.folder('roi_analyses');
      roiAnalyses.forEach((roi, idx) => {
        const content = JSON.stringify(roi, null, 2);
        roiFolder.file(`roi_${idx}.json`, content);
      });
    }

    // Generate ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${projectName}.zip`);

  } catch (error) {
    console.error('Project export error:', error);
  }
};

/**
 * Parse CSV file
 * @param {File} file - CSV file
 * @returns {Promise<Array>} Parsed data
 */
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
};
