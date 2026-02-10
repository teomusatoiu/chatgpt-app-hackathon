export type AlbumPhoto = {
  id: string;
  title: string;
  url: string;
};

export type Album = {
  id: string;
  title: string;
  cover: string;
  photos: AlbumPhoto[];
};

export type AlbumsData = {
  albums: Album[];
};
