/// <reference types="astro/client" />
import { getAudioDurationInSeconds } from 'get-audio-duration';
import path from 'path';

export interface Podcast {
  id: number;
  title: string;
  duration: string;
  url: string;
  category: string;
}

const MIN_TITLE_LENGTH = 2;
const MAX_TITLE_LENGTH = 100;

export async function getMP3Files(): Promise<Podcast[]> {
  try {
    const files = import.meta.glob('/public/mp3/*.mp3', { eager: true });
    
    if (Object.keys(files).length === 0) {
      console.warn('No se encontraron archivos MP3 en el directorio.');
      return [];
    }

    const podcasts = await Promise.all(
      Object.keys(files).map(async (filePath, index): Promise<Podcast | null> => {
        const fileName = path.basename(filePath, '.mp3');
        const publicPath = `/mp3/${path.basename(filePath)}`;
        const fullPath = path.join(process.cwd(), 'public', 'mp3', path.basename(filePath));
        
        try {
          const durationInSeconds = await getAudioDurationInSeconds(fullPath);
          
          if (isNaN(durationInSeconds) || durationInSeconds <= 0) {
            console.error(`Duración inválida para el archivo ${fileName}`);
            return null;
          }

          const minutes = Math.floor(durationInSeconds / 60);
          const seconds = Math.floor(durationInSeconds % 60);
          const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

          // Convertir el nombre del archivo a un título más legible
          const title = fileName
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .trim();

          if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
            console.error(`Título inválido para el archivo ${fileName}`);
            return null;
          }

          const category = title.split(' ')[0];
          
          if (!category) {
            console.error(`No se pudo extraer la categoría del archivo ${fileName}`);
            return null;
          }

          return {
            id: index + 1,
            title,
            duration,
            url: publicPath,
            category
          };
        } catch (error) {
          console.error(`Error procesando el archivo ${fileName}:`, error instanceof Error ? error.message : String(error));
          return null;
        }
      })
    );

    const validPodcasts = podcasts.filter((podcast): podcast is Podcast => podcast !== null);
    
    if (validPodcasts.length === 0) {
      console.warn('No se pudieron procesar archivos MP3 válidos.');
    }

    return validPodcasts;
  } catch (error) {
    console.error('Error al obtener los archivos MP3:', error instanceof Error ? error.message : String(error));
    return [];
  }
} 