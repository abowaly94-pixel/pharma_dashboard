import React, { useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ExternalLink, Satellite, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { NursingBooking } from '@/types';

// Helper component to fix Leaflet rendering inside modals
function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

interface BookingLocationModalProps {
  booking: NursingBooking | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingLocationModal: React.FC<BookingLocationModalProps> = ({
  booking,
  isOpen,
  onClose,
}) => {
  const [mapType, setMapType] = React.useState<'satellite' | 'street'>('satellite');

  const patientPinIcon = useMemo(
    () =>
      new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        iconSize: [42, 42],
        iconAnchor: [21, 42],
        popupAnchor: [0, -42],
      }),
    []
  );

  if (!booking || !booking.latitude || !booking.longitude) return null;

  const lat = booking.latitude;
  const lng = booking.longitude;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] max-w-3xl font-cairo p-0 overflow-hidden rounded-2xl sm:rounded-3xl max-h-[92vh] flex flex-col" dir="rtl">
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-900 text-white flex flex-row items-center justify-between border-b border-slate-800 shrink-0">
          <DialogTitle className="text-sm sm:text-lg font-bold font-cairo flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
            <span className="truncate">موقع زيارة المريض: {booking.userName}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Clean Interactive Map */}
        <div className="relative w-full h-[280px] xs:h-[340px] sm:h-[420px] grow">
          <MapContainer
            center={[lat, lng]}
            zoom={17}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
          >
            <MapInvalidateSize />
            {mapType === 'satellite' ? (
              <>
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; Esri"
                  maxZoom={20}
                  maxNativeZoom={18}
                />
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={20}
                  maxNativeZoom={18}
                />
              </>
            ) : (
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={20}
                maxNativeZoom={19}
              />
            )}

            <Marker position={[lat, lng]} icon={patientPinIcon}>
              <Popup className="font-cairo">
                <div className="text-center p-1 font-cairo">
                  <p className="font-bold text-slate-900 text-sm">{booking.userName}</p>
                  {booking.userPhone && <p className="text-xs text-slate-600 mt-1">{booking.userPhone}</p>}
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Clean Map Type Toggle */}
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-[1000]">
            <Button
              type="button"
              size="sm"
              onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
              className="bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700/50 shadow-md text-[11px] sm:text-xs font-cairo px-2.5 py-1 h-auto"
            >
              {mapType === 'satellite' ? '🗺️ شوارع' : '🛰️ قمر صناعي'}
            </Button>
          </div>
        </div>

        {/* Minimal Footer with Close Button Only */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <Button onClick={onClose} className="font-cairo text-xs bg-slate-900 hover:bg-slate-800 text-white px-6 h-9 sm:h-10">
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
