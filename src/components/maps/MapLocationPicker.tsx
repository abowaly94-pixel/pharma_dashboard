import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Layers, Plus, X, Navigation, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Custom Pin Marker Icon
const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

interface MapLocationPickerProps {
  latitude?: number;
  longitude?: number;
  coverageAreas?: string[];
  coverageRadiusKm?: number;
  onChange: (data: {
    latitude: number;
    longitude: number;
    coverageAreas: string[];
    coverageRadiusKm: number;
    locationAr?: string;
  }) => void;
}

// Component to handle map clicks & center updates
function MapEventsHandler({
  onSelectPosition,
}: {
  onSelectPosition: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelectPosition(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to programmatically re-center map
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

const PRESET_AREAS = [
  'الشيخ زايد',
  '6 أكتوبر',
  'المعادي',
  'التجمع الخامس',
  'مدينة نصر',
  'مصر الجديدة',
  'المهندسين',
  'الدقي',
  'الشروق',
  'العبور',
];

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  latitude = 30.0444,
  longitude = 31.2357,
  coverageAreas = [],
  coverageRadiusKm = 10,
  onChange,
}) => {
  const [position, setPosition] = useState<[number, number]>([
    latitude || 30.0444,
    longitude || 31.2357,
  ]);
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  const [radius, setRadius] = useState<number>(coverageRadiusKm || 10);
  const [areas, setAreas] = useState<string[]>(coverageAreas || []);
  const [newAreaInput, setNewAreaInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    setAreas(coverageAreas || []);
  }, [coverageAreas]);

  useEffect(() => {
    setRadius(coverageRadiusKm || 10);
  }, [coverageRadiusKm]);

  const handlePositionChange = (lat: number, lng: number, placeName?: string) => {
    const formattedLat = Number(lat.toFixed(6));
    const formattedLng = Number(lng.toFixed(6));
    setPosition([formattedLat, formattedLng]);
    onChange({
      latitude: formattedLat,
      longitude: formattedLng,
      coverageAreas: areas,
      coverageRadiusKm: radius,
      locationAr: placeName,
    });
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    onChange({
      latitude: position[0],
      longitude: position[1],
      coverageAreas: areas,
      coverageRadiusKm: newRadius,
    });
  };

  const handleAddArea = (areaName: string) => {
    const trimmed = areaName.trim();
    if (!trimmed) return;
    if (areas.includes(trimmed)) {
      toast.info('المنطقة مضافة بالفعل');
      return;
    }
    const updated = [...areas, trimmed];
    setAreas(updated);
    setNewAreaInput('');
    onChange({
      latitude: position[0],
      longitude: position[1],
      coverageAreas: updated,
      coverageRadiusKm: radius,
    });
  };

  const handleRemoveArea = (areaName: string) => {
    const updated = areas.filter((a) => a !== areaName);
    setAreas(updated);
    onChange({
      latitude: position[0],
      longitude: position[1],
      coverageAreas: updated,
      coverageRadiusKm: radius,
    });
  };

  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', Egypt'
        )}&accept-language=ar`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        const displayName = first.display_name.split(',')[0];
        handlePositionChange(lat, lng, displayName);
        toast.success(`تم العثور على: ${displayName}`);
      } else {
        toast.error('لم يتم العثور على الموقع المطلوب، يرجى المحاولة باسم مختلف');
      }
    } catch (err) {
      toast.error('خطأ أثناء البحث عن العنوان');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.info('جاري تحديد موقعك الحالي عبر GPS...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePositionChange(pos.coords.latitude, pos.coords.longitude);
          toast.success('تم تحديد الموقع بنجاح');
        },
        (err) => {
          toast.error('تعذر الوصول إلى الموقع الحالي، يرجى اختياره من الخريطة');
        }
      );
    }
  };

  return (
    <div className="space-y-4 font-cairo dir-rtl text-right">
      {/* Search & Mode Controls */}
      <div className="flex flex-wrap items-center gap-2 justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSearchAddress} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="ابحث عن منطقة أو عنوان (مثال: الشيخ زايد، المعادي...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 pl-3 text-xs h-9 bg-white dark:bg-slate-800"
            />
          </div>
          <Button type="submit" size="sm" variant="default" disabled={isSearching} className="h-9 text-xs">
            {isSearching ? 'جاري البحث...' : 'بحث'}
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            className="h-9 text-xs flex items-center gap-1.5 bg-white dark:bg-slate-800"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            موقعي الحالي
          </Button>

          <Button
            type="button"
            variant={mapType === 'satellite' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
            className="h-9 text-xs flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            {mapType === 'satellite' ? 'قمر صناعي 🛰️' : 'خريطة شوارع 🗺️'}
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border-2 border-emerald-500/20 shadow-md">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          {mapType === 'satellite' ? (
            <>
              {/* Esri World Imagery Satellite Tiles */}
              <TileLayer
                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={20}
                maxNativeZoom={18}
              />
              {/* Esri Transportation Labels Overlay for street names on satellite */}
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

          <MapEventsHandler
            onSelectPosition={(lat, lng) => handlePositionChange(lat, lng)}
          />
          <MapRecenter center={position} />

          <Marker position={position} icon={customIcon} />

          {/* Radius circle around nurse location */}
          <Circle
            center={position}
            radius={radius * 1000}
            pathOptions={{
              color: '#10B981',
              fillColor: '#10B981',
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
        </MapContainer>

        {/* Floating coordinates badge */}
        <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/90 text-white px-3 py-1.5 rounded-lg text-[11px] font-mono shadow-lg backdrop-blur-sm flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>خط العرض: {position[0]}</span>
          <span>|</span>
          <span>خط الطول: {position[1]}</span>
        </div>
      </div>

      {/* Coverage Radius & Cities Configuration */}
      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              نصف قطر تغطية الخدمة (بالكيلومتر) 📍
            </Label>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
              {radius} كم
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={radius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            يحدد نطاق الدائرة الخضراء للخدمات التمريضية المحيطة بموقعك على الخريطة
          </p>
        </div>

        {/* Coverage Areas Tags */}
        <div>
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
            مناطق التغطية المحددة بالاسم (مناطق العمل) 🏙️
          </Label>

          <div className="flex items-center gap-2 mb-2">
            <Input
              type="text"
              placeholder="إضافة منطقة جديدة (مثال: الشيخ زايد)"
              value={newAreaInput}
              onChange={(e) => setNewAreaInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddArea(newAreaInput);
                }
              }}
              className="text-xs h-8 bg-white dark:bg-slate-800"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => handleAddArea(newAreaInput)}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-3.5 h-3.5 ml-1" /> إضافة
            </Button>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-[11px] text-slate-400 self-center ml-1">مقترحات:</span>
            {PRESET_AREAS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleAddArea(preset)}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                  areas.includes(preset)
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                + {preset}
              </button>
            ))}
          </div>

          {/* Added Tags */}
          <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[42px] items-center">
            {areas.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                لم يتم إضافة أي مناطق محددة بعد. يمكنك اختيار من المقترحات أعلاه.
              </span>
            ) : (
              areas.map((area) => (
                <Badge
                  key={area}
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 text-xs px-2.5 py-1 flex items-center gap-1.5"
                >
                  <span>{area}</span>
                  <X
                    className="w-3 h-3 cursor-pointer text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-100 transition-colors"
                    onClick={() => handleRemoveArea(area)}
                  />
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
