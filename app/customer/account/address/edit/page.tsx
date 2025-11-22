'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../../config/api';

interface Address {
  id: string;
  label: string | null;
  fullAddress: string;
  city: string | null;
  pincode: string | null;
  latitude: string | number;
  longitude: string | number;
  isDefault: boolean;
}

interface AddressFormData {
  fullAddress: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export default function EditAddressPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [formData, setFormData] = useState<AddressFormData>({
    fullAddress: '',
    city: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
  });

  // Fetch current address
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${API_URL}/api/user/address`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const addr = data.address;
          if (addr) {
            setAddress(addr);
            setFormData({
              fullAddress: addr.fullAddress || '',
              city: addr.city || '',
              pincode: addr.pincode || '',
              latitude: typeof addr.latitude === 'string' ? parseFloat(addr.latitude) : addr.latitude || 0,
              longitude: typeof addr.longitude === 'string' ? parseFloat(addr.longitude) : addr.longitude || 0,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load address');
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;
    if (loading) return; // Wait for address to load

    const initializeMap = async () => {
      try {
        // Load Google Maps API
        if (typeof window === 'undefined') return;

        // Check if Google Maps is already loaded
        if (!(window as any).google) {
          // Load Google Maps script
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=places`;
          script.async = true;
          script.defer = true;

          script.onload = () => {
            createMap();
          };

          script.onerror = () => {
            setError('Failed to load Google Maps. Please check your API key.');
          };

          document.head.appendChild(script);
        } else {
          createMap();
        }
      } catch (err) {
        console.error('Failed to initialize map:', err);
        setError('Failed to initialize map');
      }
    };

    const createMap = () => {
      try {
        const { google } = window as any;
        if (!google || !google.maps) return;

        // Use existing coordinates or default to Delhi
        const initialLat = (formData.latitude && formData.latitude !== 0) ? formData.latitude : 28.6139;
        const initialLng = (formData.longitude && formData.longitude !== 0) ? formData.longitude : 77.2090;
        
        // Update form data if using default
        if (formData.latitude === 0 || formData.longitude === 0) {
          setFormData((prev) => ({
            ...prev,
            latitude: initialLat,
            longitude: initialLng,
          }));
        }

        // Create map
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapInstanceRef.current = map;

        // Create draggable marker
        const marker = new google.maps.Marker({
          position: { lat: initialLat, lng: initialLng },
          map: map,
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: 'Drag to adjust location',
        });

        markerRef.current = marker;

        // Initialize geocoder
        geocoderRef.current = new google.maps.Geocoder();

        // Listen to marker drag events
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            setFormData((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lng,
            }));
            // Reverse geocode on drag
            reverseGeocode(lat, lng);
          }
        });

        // Listen to map click events (alternative to dragging marker)
        map.addListener('click', (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          marker.setPosition({ lat, lng });
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }));
          // Reverse geocode on click
          reverseGeocode(lat, lng);
        });

        // Initial reverse geocode if we have valid coordinates (not default)
        if (initialLat && initialLng && address && address.latitude && address.longitude) {
          // Only reverse geocode if we have existing address coordinates
          // Wait a bit for geocoder to be ready
          setTimeout(() => {
            reverseGeocode(initialLat, initialLng);
          }, 500);
        }

        setMapLoaded(true);
      } catch (err) {
        console.error('Failed to create map:', err);
        setError('Failed to create map');
      }
    };

    initializeMap();
  }, [loading, mapLoaded, address]);

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number) => {
    if (!geocoderRef.current) {
      // Wait a bit for geocoder to be ready
      setTimeout(() => reverseGeocode(lat, lng), 200);
      return;
    }

    try {
      setGeocoding(true);
      setError(null);

      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results: any[], status: string) => {
          setGeocoding(false);
          
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            const addressComponents = result.address_components || [];
            
            // Extract address components
            let fullAddress = result.formatted_address || '';
            let city = '';
            let pincode = '';

            // Parse address components
            for (const component of addressComponents) {
              const types = component.types || [];
              
              if (types.includes('postal_code')) {
                pincode = component.long_name || component.short_name || '';
              }
              
              if (types.includes('locality')) {
                city = component.long_name || city;
              }
              
              // For Indian addresses, prefer administrative_area_level_2 as city
              if (types.includes('administrative_area_level_2') && !city) {
                city = component.long_name || '';
              }
              
              // Fallback to administrative_area_level_1 (state) if no city found
              if (!city && types.includes('administrative_area_level_1')) {
                city = component.long_name || '';
              }
            }

            // Update form data, preserving existing values if new ones are empty
            setFormData((prev) => ({
              ...prev,
              fullAddress: fullAddress || prev.fullAddress,
              city: city || prev.city,
              pincode: pincode || prev.pincode,
              latitude: lat,
              longitude: lng,
            }));
          } else {
            console.warn('Geocoding failed:', status);
            // Update coordinates even if geocoding fails
            setFormData((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lng,
            }));
          }
        }
      );
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      setGeocoding(false);
      // Still update coordinates
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setGeocoding(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        // Update marker position
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        }

        // Update map center
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(15);
        }

        // Reverse geocode
        reverseGeocode(lat, lng);
      },
      (err) => {
        setError('Failed to get current location: ' + err.message);
        setGeocoding(false);
        // Use default location if geolocation fails
        const defaultLat = 28.6139;
        const defaultLng = 77.2090;
        setFormData((prev) => ({
          ...prev,
          latitude: defaultLat,
          longitude: defaultLng,
        }));
        if (markerRef.current) {
          markerRef.current.setPosition({ lat: defaultLat, lng: defaultLng });
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat: defaultLat, lng: defaultLng });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Handle form input changes
  const handleInputChange = (field: keyof AddressFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.fullAddress.trim()) {
      setError('Full address is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode.trim())) {
      setError('Pincode must be exactly 6 digits');
      return false;
    }
    if (formData.latitude === 0 || formData.longitude === 0) {
      setError('Please select a location on the map');
      return false;
    }
    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/api/user/location`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: formData.latitude,
          longitude: formData.longitude,
          fullAddress: formData.fullAddress.trim(),
          city: formData.city.trim(),
          pincode: formData.pincode.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save address');
      }

      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/customer/account');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !mapLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Address</h1>
              <p className="text-gray-500 mt-1">Drag the pin to adjust your location</p>
            </div>
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 transition rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl flex items-center gap-3"
            >
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Address saved successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Location</h2>
            <motion.button
              onClick={getCurrentLocation}
              disabled={loading || geocoding}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use Current Location
            </motion.button>
          </div>
          
          {/* Map Container */}
          <div className="relative">
            <div
              ref={mapRef}
              className="w-full h-96 rounded-xl border-2 border-gray-200 overflow-hidden shadow-inner"
              style={{ minHeight: '400px' }}
            />
            
            {/* Loading Overlay */}
            {(loading || geocoding) && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">
                    {loading ? 'Loading map...' : 'Getting address...'}
                  </p>
                </div>
              </div>
            )}

            {/* Map Instructions */}
            {mapLoaded && !loading && (
              <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10 max-w-xs">
                <p className="text-xs text-gray-700 font-medium">
                  💡 Drag the pin or click on the map to set your location
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Address Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Address Details</h2>
          
          <div className="space-y-4">
            {/* Full Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.fullAddress}
                onChange={(e) => handleInputChange('fullAddress', e.target.value)}
                placeholder="Enter your full address"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-gray-900 placeholder-gray-400 resize-none"
              />
            </div>

            {/* City and Pincode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
                    handleInputChange('pincode', value);
                  }}
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Coordinates Display (Read-only) */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Location Coordinates</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Latitude</p>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {formData.latitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Longitude</p>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {formData.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4"
        >
          <motion.button
            onClick={() => router.back()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
          >
            Cancel
          </motion.button>
          
          <motion.button
            onClick={handleSave}
            disabled={saving || !formData.fullAddress.trim() || !formData.city.trim() || !/^\d{6}$/.test(formData.pincode.trim()) || formData.latitude === 0 || formData.longitude === 0}
            whileHover={!saving ? { scale: 1.02 } : {}}
            whileTap={!saving ? { scale: 0.98 } : {}}
            className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Address
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

