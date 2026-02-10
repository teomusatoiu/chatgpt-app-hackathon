export type Place = {
  id: string;
  name: string;
  coords: [number, number];
  description: string;
  city?: string;
  rating: number;
  price?: string;
  thumbnail: string;
};

export type PlacesData = {
  places: Place[];
};
