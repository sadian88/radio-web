import { getAudioDurationInSeconds } from 'get-audio-duration';
import path from 'path';

export async function getMP3Files() {
  const mp3Dir = path.join(process.cwd(), 'public', 'mp3');
  const files = await import.meta.glob('/public/mp3/*.mp3');
  
  const podcasts = await Promise.all(
    Object.keys(files).map(async (filePath, index) => {
      const fileName = path.basename(filePath, '.mp3');
      const publicPath = `/mp3/${path.basename(filePath)}`;
      const fullPath = path.join(process.cwd(), 'public', 'mp3', path.basename(filePath));
      
      try {
        const durationInSeconds = await getAudioDurationInSeconds(fullPath);
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = Math.floor(durationInSeconds % 60);
        const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Convertir el nombre del archivo a un título más legible
        const title = fileName
          .replace(/-/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return {
          id: index + 1,
          title,
          duration,
          url: publicPath,
          // Extraer la categoría del nombre del archivo si sigue un patrón específico
          // Por ejemplo: "devocional-diario.mp3" -> categoría: "Devocional"
          category: title.split(' ')[0]
        };
      } catch (error) {
        console.error(`Error processing ${fileName}:`, error);
        return null;
      }
    })
  );

  return podcasts.filter(Boolean); // Eliminar cualquier null del array
} 