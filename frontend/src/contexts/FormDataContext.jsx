// src/contexts/FormDataContext.jsx - نسخه ساده با پیش‌فرض
import React, { createContext, useContext, useState, useCallback } from "react";

const FormDataContext = createContext();

export const FormDataProvider = ({ children }) => {
  // ✅ state با مقادیر پیش‌فرض (برای autocomplete)
  const [formData, setFormData] = useState({
    initialParameters: {
      power: "",
      tubeVoltage: "",
      anodeCurrent: "",
      anodeCurrentUnit: "mA",
      filtrationMaterial: "Al",
      filtrationThickness: "",
      bitDepth: "8-bit",
      tubeStatus: false,
      tubeVoltageDisplay: "0",
      tubeCurrentDisplay: "0",
      exposureTime: "0",
      cabinCameraStatus: false,
      singleCalibration: "",
      rotateCalibration: "",
      fastImaging: false,
      rotationSpeed: "10",
      dualEnergy: false,
    },
    positionAndOptimization: {
      manipulatorX: "",
      manipulatorY: "",
      manipulatorZ: "",
      manipulatorTheta: "",
      manipulatorGamma: "",
      joystickSpeed: "Medium",
      uploadedFile: null,
    },
    postProcessing: {
      rotationAngle: "None",
      mirroring: false,
      medianFilter: false,
      gaussianFilter: false,
      gaussianSigma: "1.0",
      meanFilter: false,
      varianceFilter: false,
      pseudoColorFilter: false,
      fourierFilter: "Low Pass",
      sharpening: false,
      kernelSize: "3x3",
      sharpeningStrength: "1.0",
      edgeDetection: false,
      threshold: "100",
      edgeMethod: "Sobel",
      exportFormat: "TIFF",
    },
    projectionAcquisition: {
      imagingMode: "180°",
      multiSegmentSize: "",
      hdrStatus: false,
      energyLevel1: "80",
      energyLevel2: "120",
      imageCount: "2",
    },
    reconstruction: {
      algorithm: "FBP",
      iterationCount: "10",
      filterType: "Ram-Lak",
      pixelSize: "0.1",
      reconstructionMode: "2D",
      outputFormat: "DICOM"
    },
  });

  // ✅ Update کردن یک صفحه
  const updateFormData = useCallback((page, data) => {
    setFormData((prev) => ({
      ...prev,
      [page]: data,
    }));
  }, []);

  // ✅ گرفتن همه دیتاها (فقط صفحاتی که تغییر کرده‌اند)
  const getAllFormData = useCallback(() => {
    const nonEmptyData = {};
    
    Object.entries(formData).forEach(([page, data]) => {
      if (data && Object.keys(data).length > 0) {
        // فقط فیلدهایی که کاربر پرشون کرده (نه پیش‌فرض خالی)
        const filledData = {};
        Object.entries(data).forEach(([key, value]) => {
          // مقادیر boolean و پیش‌فرض‌های مفید رو نگه داریم
          if (
            value !== null && 
            value !== undefined && 
            value !== '' ||
            typeof value === 'boolean' ||
            (typeof value === 'string' && ['mA', 'Al', '8-bit', 'Medium', 'None', 'Low Pass', '3x3', 'Sobel', 'TIFF', '180°', 'FBP', 'Ram-Lak', '2D', 'DICOM'].includes(value))
          ) {
            filledData[key] = value;
          }
        });
        
        if (Object.keys(filledData).length > 0) {
          nonEmptyData[page] = filledData;
        }
      }
    });
    
    return nonEmptyData;
  }, [formData]);

  return (
    <FormDataContext.Provider value={{ 
      formData, 
      updateFormData, 
      getAllFormData 
    }}>
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = () => useContext(FormDataContext);