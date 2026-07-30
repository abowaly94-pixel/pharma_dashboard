import React, { useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ExternalLink, Satellite, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Order } from '@/types';

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

interface OrderLocationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderLocationModal: React.FC<OrderLocationModalProps> = ({
  order,
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

  if (!order) return null;

  const lat = order.latitude ?? order.shippingAddressEntity?.latitude;
  const lng = order.longitude ?? order.shippingAddressEntity?.longitude;

  if (!lat || !lng) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const userName = order.shippingAddressEntity?.namee || 'العميل';
  const userPhone = order.shippingAddressEntity?.phoneNumber || '';
  const fullAddress = `${order.shippingAddressEntity?.city || ''} - ${order.shippingAddressEntity?.address || ''} (شقة: ${order.shippingAddressEntity?.apartmentNumber || ''})`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl font-cairo p-0 overflow-hidden rounded-3xl" dir="rtl">
        <DialogHeader className="p-6 bg-slate-900 text-white flex flex-row items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-bold font-cairo flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                موقع توصيل الطلب #{order.orderId?.slice(-8)} ({userName})
              </DialogTitle>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                {mapType === 'satellite' ? 'خريطة قمر صناعي تفاعلية 🛰️' : 'خريطة شوارع تفاعلية 🗺️'}
              </Badge>
            </div>
            <DialogDescription className="text-slate-400 text-xs mt-1 font-cairo">
              {fullAddress}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Interactive Satellite / Street Map */}
        <div className="relative w-full h-[420px]">
          <MapContainer
            center={[lat, lng]}
            zoom={17}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
          >
            <MapInvalidateSize />
            {mapType === 'satellite' ? (
              <>
                {/* Esri World Imagery (Satellite Tiles) with maxNativeZoom to prevent tile missing errors */}
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                  maxZoom={20}
                  maxNativeZoom={18}
                />
                {/* Esri Transportation Labels Overlay for Streets & Labels */}
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={20}
                  maxNativeZoom={18}
                />
              </>
            ) : (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={20}
                maxNativeZoom={19}
              />
            )}

            <Marker position={[lat, lng]} icon={patientPinIcon}>
              <Popup className="font-cairo">
                <div className="text-center p-1 font-cairo">
                  <p className="font-bold text-slate-900 text-sm">{userName}</p>
                  <p className="text-xs text-slate-600 mt-1">{userPhone}</p>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono" dir="ltr">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Map Type Toggle */}
          <div className="absolute top-4 left-4 z-[1000]">
            <Button
              type="button"
              size="sm"
              onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
              className="bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/50 shadow-md text-xs font-cairo gap-1.5"
            >
              {mapType === 'satellite' ? '🗺️ خريطة الشوارع' : '🛰️ قمر صناعي'}
            </Button>
          </div>

          {/* Floating badge for coordinates */}
          <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl border border-slate-700/50 shadow-lg text-xs flex items-center gap-2">
            <Satellite className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-[11px]" dir="ltr">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-600 flex items-center gap-1.5 overflow-hidden">
            <Navigation className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-medium truncate">العنوان: {fullAddress}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={onClose} className="font-cairo text-xs">
              إغلاق
            </Button>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-cairo text-xs gap-1.5">
                <ExternalLink className="w-4 h-4" />
                فتح في تطبيق خرائط جوجل 📍
              </Button>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
