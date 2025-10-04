import React, { createContext, useContext, useState, useCallback } from 'react';

const IntensityProfileContext = createContext();

export const useIntensityProfile = () => {
  const context = useContext(IntensityProfileContext);
  if (!context) {
    throw new Error('useIntensityProfile must be used within IntensityProfileProvider');
  }
  return context;
};

export const IntensityProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Add a new intensity profile
  const addProfile = useCallback((profile) => {
    const newProfile = {
      id: `profile-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...profile
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    return newProfile;
  }, []);

  // Remove a profile
  const removeProfile = useCallback((profileId) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    if (activeProfileId === profileId) {
      setActiveProfileId(null);
    }
  }, [activeProfileId]);

  // Update a profile
  const updateProfile = useCallback((profileId, updates) => {
    setProfiles(prev => prev.map(p =>
      p.id === profileId ? { ...p, ...updates } : p
    ));
  }, []);

  // Clear all profiles
  const clearProfiles = useCallback(() => {
    setProfiles([]);
    setActiveProfileId(null);
    setSelectedRegion(null);
  }, []);

  // Get active profile
  const getActiveProfile = useCallback(() => {
    return profiles.find(p => p.id === activeProfileId);
  }, [profiles, activeProfileId]);

  const value = {
    profiles,
    activeProfileId,
    selectedRegion,
    setActiveProfileId,
    setSelectedRegion,
    addProfile,
    removeProfile,
    updateProfile,
    clearProfiles,
    getActiveProfile
  };

  return (
    <IntensityProfileContext.Provider value={value}>
      {children}
    </IntensityProfileContext.Provider>
  );
};
