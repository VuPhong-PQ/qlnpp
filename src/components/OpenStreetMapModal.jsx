import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { API_ENDPOINTS } from '../config/api';

// Fix for default marker icon in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to fly to location when position changes
function FlyToLocation({ position }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, {
        duration: 1.5
      });
    }
  }, [position, map]);
  
  return null;
}

const OpenStreetMapModal = ({ isOpen, onClose, customer }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Decode Plus Code (Open Location Code) to coordinates
  const decodePlusCode = (plusCode) => {
    try {
      // Plus Code format: XXXX+XX (short code, needs reference location)
      // For Vietnam/Southeast Asia, we'll use a reference point
      const code = plusCode.toUpperCase().replace(/\s/g, '');
      const match = code.match(/^([23456789CFGHJMPQRVWX]{4})\+([23456789CFGHJMPQRVWX]{2,3})$/);
      
      if (!match) {
        console.log('Plus Code format not matched:', code);
        return null;
      }

      const ALPHABET = '23456789CFGHJMPQRVWX';
      const firstPart = match[1]; // e.g., "6X6V"
      const secondPart = match[2]; // e.g., "QHW"
      
      // Short codes need a reference location
      // For Vietnam (Phú Quốc area), use reference: ~10°N, 104°E
      // This is a simplified decoder - for production, use a proper library
      
      // Decode first pair (lat)
      const lat1Index = ALPHABET.indexOf(firstPart[0]);
      const lat2Index = ALPHABET.indexOf(firstPart[2]);
      
      // Decode second pair (lng)
      const lng1Index = ALPHABET.indexOf(firstPart[1]);
      const lng2Index = ALPHABET.indexOf(firstPart[3]);
      
      // Calculate base coordinates (20-degree grid)
      let lat = (lat1Index * 20) - 90;
      let lng = (lng1Index * 20) - 180;
      
      // Add 1-degree precision
      lat += lat2Index;
      lng += lng2Index;
      
      // Decode refinement (grid squares within 1 degree)
      if (secondPart.length >= 2) {
        const refLat1 = ALPHABET.indexOf(secondPart[0]);
        const refLng1 = ALPHABET.indexOf(secondPart[1]);
        lat += refLat1 * 0.05; // 1/20 of a degree
        lng += refLng1 * 0.05;
      }
      
      if (secondPart.length >= 3) {
        const refLat2 = ALPHABET.indexOf(secondPart[2]);
        lat += refLat2 * 0.0025; // 1/400 of a degree
      }
      
      // Center of grid square
      lat += 0.00125;
      lng += 0.025;
      
      console.log('Decoded Plus Code:', plusCode, '→', [lat, lng]);
      return [lat, lng];
    } catch (err) {
      console.error('Error decoding Plus Code:', err);
      return null;
    }
  };

  // Parse coordinates from position field
  const getCoordinates = async (position) => {
    if (!position) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try backend API to parse coordinates (supports Plus Code, direct coords, etc.)
      try {
        const response = await fetch(
          `${API_ENDPOINTS.geocoding}/parse-coordinates?input=${encodeURIComponent(position)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.latitude && data.longitude) {
            console.log('Backend parsed:', data);
            setLoading(false);
            return [data.latitude, data.longitude];
          }
        }
      } catch (apiError) {
        console.warn('Backend API failed, trying client-side parsing:', apiError);
      }

      // Fallback to client-side parsing
      
      // Format 0: Check for shortened URLs that need expansion
      if (position.includes('goo.gl') || position.includes('maps.app.goo.gl')) {
        setError('Link rút gọn cần được mở rộng. Vui lòng: 1) Mở link trong trình duyệt, 2) Copy tọa độ từ URL hoặc 3) Click chuột phải trên bản đồ → Copy tọa độ');
        setLoading(false);
        return null;
      }

      // Format 1: Direct coordinates "lat,lng" or "10.8231,106.6297"
      const coordMatch = position.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        // Validate coordinates
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          setLoading(false);
          return [lat, lng];
        }
      }
      
      // Format 2: Google Maps shortened URL - https://maps.app.goo.gl/... or https://goo.gl/maps/...
      if (position.includes('goo.gl') || position.includes('maps.app.goo.gl')) {
        try {
          // Extract the actual URL by using a CORS proxy or iframe technique
          // Since we can't directly fetch due to CORS, we'll use regex to extract from common patterns
          
          // Try to use Nominatim reverse geocoding if we have an address
          setError('Link rút gọn cần được mở rộng. Vui lòng: 1) Mở link trong trình duyệt, 2) Copy tọa độ từ URL hoặc 3) Click chuột phải trên bản đồ → Copy tọa độ');
          setLoading(false);
          return null;
        } catch (e) {
          console.error('Error fetching shortened URL:', e);
        }
      }
      
      // Format 3: Google Maps URL - https://maps.google.com/?q=10.8231,106.6297
      const googleMapsQ = position.match(/[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (googleMapsQ) {
        setLoading(false);
        return [parseFloat(googleMapsQ[1]), parseFloat(googleMapsQ[2])];
      }
      
      // Format 4: Google Maps URL - https://www.google.com/maps/@10.8231,106.6297,15z
      const googleMapsAt = position.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (googleMapsAt) {
        setLoading(false);
        return [parseFloat(googleMapsAt[1]), parseFloat(googleMapsAt[2])];
      }
      
      // Format 5: Zalo location format
      const zaloMatch = position.match(/lat[:\s=]+(-?\d+\.?\d*)[,\s]+(?:lng|lon)[:\s=]+(-?\d+\.?\d*)/i);
      if (zaloMatch) {
        setLoading(false);
        return [parseFloat(zaloMatch[1]), parseFloat(zaloMatch[2])];
      }
      
      // Format 6: Reverse format check
      const reverseMatch = position.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (reverseMatch) {
        const first = parseFloat(reverseMatch[1]);
        const second = parseFloat(reverseMatch[2]);
        if (Math.abs(first) > 90 && Math.abs(second) <= 90) {
          setLoading(false);
          return [second, first]; // swap
        }
      }
      
      setError('Không thể phân tích tọa độ. Vui lòng nhập đúng định dạng.');
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      setError('Lỗi khi phân tích tọa độ.');
    }
    
    setLoading(false);
    return null;
  };

  useEffect(() => {
    const loadCoordinates = async () => {
      if (customer?.position) {
        console.log('Loading coordinates from position:', customer.position);
        const coords = await getCoordinates(customer.position);
        console.log('Parsed coordinates:', coords);
        setCoordinates(coords);
      }
    };
    
    if (isOpen) {
      loadCoordinates();
    }
  }, [isOpen, customer?.position]);

  const defaultCenter = [10.8231, 106.6297]; // TP.HCM
  const mapCenter = coordinates || defaultCenter;

  // Open Google Maps navigation
  const openGoogleMapsNavigation = () => {
    if (coordinates) {
      const lat = coordinates[0];
      const lng = coordinates[1];
      // Google Maps navigation URL format
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      setSelectedMarker(customer);
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <h3 style={{ margin: 0 }}>
            Vị trí: {customer?.name || 'Khách hàng'}
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {coordinates && (
              <button
                onClick={openGoogleMapsNavigation}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4285f4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Mở Google Maps để chỉ đường"
              >
                <span>🧭</span>
                <span>Chỉ đường</span>
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>
        </div>
        
        <div style={{ 
          padding: '16px',
          overflowY: 'auto',
          flex: 1
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              <div>Đang phân tích tọa độ...</div>
            </div>
          )}
          
          {error && (
            <div style={{ 
              padding: '12px', 
              marginBottom: '16px',
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffc107',
              borderRadius: '4px',
              color: '#856404'
            }}>
              <strong>⚠️ Lưu ý:</strong> {error}
            </div>
          )}
          
          <div style={{ height: '400px', width: '100%', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
            <MapContainer 
              center={mapCenter} 
              zoom={coordinates ? 15 : 12} 
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              key={`${mapCenter[0]}-${mapCenter[1]}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {coordinates && (
                <>
                  <FlyToLocation position={coordinates} />
                  <Marker position={coordinates}>
                    <Popup>
                      <div style={{ padding: '8px', minWidth: '200px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#2196F3' }}>{customer.name}</h4>
                        <p style={{ margin: '4px 0', fontSize: '13px' }}>
                          <strong>Mã:</strong> {customer.code}
                        </p>
                        {customer.address && (
                          <p style={{ margin: '4px 0', fontSize: '13px' }}>
                            <strong>Địa chỉ:</strong> {customer.address}
                          </p>
                        )}
                        {customer.phone && (
                          <p style={{ margin: '4px 0', fontSize: '13px' }}>
                            <strong>SĐT:</strong> {customer.phone}
                          </p>
                        )}
                        {customer.email && (
                          <p style={{ margin: '4px 0', fontSize: '13px' }}>
                            <strong>Email:</strong> {customer.email}
                          </p>
                        )}
                        <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                          <strong>Tọa độ:</strong> {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>
          </div>
          
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '8px',
            border: '1px solid #2196F3'
          }}>
            <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: '#1976D2', fontSize: '15px' }}>
              📍 Hướng dẫn sử dụng
            </p>
            <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#333' }}>
              <p style={{ margin: '8px 0' }}>
                <strong>• Nhập tọa độ trực tiếp:</strong> <code style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', color: '#d32f2f', fontWeight: 'bold' }}>10.8231,106.6297</code>
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>• Plus Code:</strong> <code style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', color: '#1976D2', fontWeight: 'bold' }}>6X6V+QHW</code>
                <br />
                <span style={{ fontSize: '11px', color: '#4caf50', marginTop: '4px', display: 'block' }}>
                  ✓ Hỗ trợ tự động chuyển đổi
                </span>
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>• Copy link Google Maps:</strong> Dán cả URL vào trường "Vị trí"
                <br />
                <code style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', color: '#666', fontSize: '11px', display: 'inline-block', marginTop: '4px' }}>
                  https://maps.google.com/?q=10.8231,106.6297
                </code>
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>• Copy từ Zalo:</strong> Dán trực tiếp text chứa tọa độ
                <br />
                <code style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', color: '#666', fontSize: '11px', display: 'inline-block', marginTop: '4px' }}>
                  lat: 10.8231, lng: 106.6297
                </code>
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>• Lấy tọa độ từ Google Maps:</strong>
                <br />
                <span style={{ fontSize: '12px', color: '#555', display: 'block', marginTop: '4px' }}>
                  1. Mở Google Maps → Tìm địa điểm<br />
                  2. Click chuột phải → Chọn tọa độ (tự động copy)<br />
                  3. Paste vào trường "Vị trí"
                </span>
              </p>
              <p style={{ margin: '8px 0', padding: '8px', background: '#e8f5e9', borderRadius: '4px', border: '1px solid #4caf50' }}>
                <strong style={{ color: '#2e7d32' }}>🧭 Chỉ đường:</strong>
                <br />
                <span style={{ fontSize: '12px', color: '#555' }}>
                  Nhấn nút "Chỉ đường" để mở Google Maps dẫn đường tự động
                </span>
              </p>
              <p style={{ margin: '12px 0 8px 0', padding: '8px', background: '#fff', borderRadius: '4px', border: '1px solid #4caf50' }}>
                <strong style={{ color: '#2e7d32' }}>✨ Hỗ trợ đa định dạng:</strong>
                <br />
                <span style={{ fontSize: '12px', color: '#555' }}>
                  Tự động nhận diện: Tọa độ số, Plus Code, Google Maps URL, Zalo location
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenStreetMapModal;
