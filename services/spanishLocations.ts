
export interface Province {
  id: string;
  name: string;
  lat: number;
  lng: number;
  cities: string[];
}

export const SPANISH_LOCATIONS: Province[] = [
  { id: 'MAD', name: 'Madrid', lat: 40.4168, lng: -3.7038, cities: ['Madrid', 'Alcalá de Henares', 'Getafe', 'Leganés', 'Móstoles'] },
  { id: 'BCN', name: 'Barcelona', lat: 41.3851, lng: 2.1734, cities: ['Barcelona', 'L\'Hospitalet', 'Badalona', 'Terrassa', 'Sabadell'] },
  { id: 'VAL', name: 'Valencia', lat: 39.4699, lng: -0.3763, cities: ['Valencia', 'Torrent', 'Gandia', 'Paterna', 'Sagunto'] },
  { id: 'SEV', name: 'Sevilla', lat: 37.3891, lng: -5.9845, cities: ['Sevilla', 'Dos Hermanas', 'Alcalá de Guadaíra', 'Utrera'] },
  { id: 'ZAR', name: 'Zaragoza', lat: 41.6488, lng: -0.8891, cities: ['Zaragoza', 'Calatayud', 'Utebo'] },
  { id: 'MAL', name: 'Málaga', lat: 36.7212, lng: -4.4217, cities: ['Málaga', 'Marbella', 'Vélez-Málaga', 'Mijas', 'Fuengirola'] },
  { id: 'MUR', name: 'Murcia', lat: 37.9922, lng: -1.1307, cities: ['Murcia', 'Cartagena', 'Lorca', 'Molina de Segura'] },
  { id: 'PAL', name: 'Las Palmas', lat: 28.1235, lng: -15.4363, cities: ['Las Palmas de Gran Canaria', 'Telde', 'Santa Lucía'] },
  { id: 'BIL', name: 'Bizkaia', lat: 43.2630, lng: -2.9350, cities: ['Bilbao', 'Barakaldo', 'Getxo', 'Portugalete'] },
  { id: 'ALI', name: 'Alicante', lat: 38.3452, lng: -0.4810, cities: ['Alicante', 'Elche', 'Torrevieja', 'Orihuela'] },
  { id: 'COR', name: 'Córdoba', lat: 37.8882, lng: -4.7794, cities: ['Córdoba', 'Lucena', 'Puente Genil'] },
  { id: 'VLL', name: 'Valladolid', lat: 41.6523, lng: -4.7245, cities: ['Valladolid', 'Laguna de Duero', 'Medina del Campo'] },
  { id: 'PON', name: 'Pontevedra', lat: 42.4299, lng: -8.6446, cities: ['Vigo', 'Pontevedra', 'Vilagarcía de Arousa'] },
  { id: 'AST', name: 'Asturias', lat: 43.3619, lng: -5.8494, cities: ['Oviedo', 'Gijón', 'Avilés'] },
  { id: 'CORU', name: 'A Coruña', lat: 43.3623, lng: -8.4115, cities: ['A Coruña', 'Santiago de Compostela', 'Ferrol'] }
  // Simplified list for demo purposes, can be expanded.
];

export const getProvinceCoordinates = (provName: string): {lat: number, lng: number} | null => {
  const p = SPANISH_LOCATIONS.find(loc => loc.name === provName);
  return p ? { lat: p.lat, lng: p.lng } : null;
}
