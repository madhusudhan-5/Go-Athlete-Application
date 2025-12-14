import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VendorContext = createContext();

export const VendorProvider = ({ children }) => {
  const [vendorId, setVendorIdState] = useState(null);
  const [vendorType, setVendorTypeState] = useState('VENUE');
  const [vendorStatus, setVendorStatusState] = useState('PENDING');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      const [id, type, status] = await Promise.all([
        AsyncStorage.getItem('vendor_id'),
        AsyncStorage.getItem('vendor_type'),
        AsyncStorage.getItem('vendor_status'),
      ]);
      
      if (id) setVendorIdState(parseInt(id));
      if (type) setVendorTypeState(type);
      if (status) setVendorStatusState(status);
    } catch (error) {
      console.error('Failed to load vendor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setVendorId = async (id) => {
    try {
      if (id) {
        await AsyncStorage.setItem('vendor_id', id.toString());
        setVendorIdState(id);
      }
    } catch (error) {
      console.error('Failed to save vendor ID:', error);
    }
  };

  const setVendorType = async (type) => {
    try {
      const validType = type || 'VENUE';
      await AsyncStorage.setItem('vendor_type', validType);
      setVendorTypeState(validType);
    } catch (error) {
      console.error('Failed to save vendor type:', error);
    }
  };

  const setVendorStatus = async (status) => {
    try {
      const validStatus = status || 'PENDING';
      await AsyncStorage.setItem('vendor_status', validStatus);
      setVendorStatusState(validStatus);
    } catch (error) {
      console.error('Failed to save vendor status:', error);
    }
  };

  const clearVendorData = async () => {
    try {
      await AsyncStorage.multiRemove([
        'vendor_id', 
        'vendor_type', 
        'vendor_status', 
        'access_token', 
        'refresh_token'
      ]);
      setVendorIdState(null);
      setVendorTypeState('VENUE');
      setVendorStatusState('PENDING');
    } catch (error) {
      console.error('Failed to clear vendor data:', error);
    }
  };

  const hasVenueAccess = () => {
    return ['VENUE', 'VENUE_COACH', 'VENUE_ECOM', 'ALL'].includes(vendorType);
  };

  const hasCoachAccess = () => {
    return ['COACH', 'VENUE_COACH', 'COACH_ECOM', 'ALL'].includes(vendorType);
  };

  const hasEcomAccess = () => {
    return ['ECOM', 'VENUE_ECOM', 'COACH_ECOM', 'ALL'].includes(vendorType);
  };

  const isApproved = () => {
    return vendorStatus === 'APPROVED';
  };

  return (
    <VendorContext.Provider value={{ 
      vendorId, 
      vendorType: vendorType || 'VENUE',
      vendorStatus: vendorStatus || 'PENDING',
      setVendorId, 
      setVendorType,
      setVendorStatus,
      clearVendorData,
      hasVenueAccess,
      hasCoachAccess,
      hasEcomAccess,
      isApproved,
      isLoading 
    }}>
      {children}
    </VendorContext.Provider>
  );
};

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};
