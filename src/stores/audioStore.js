let instance = null;

class AudioStore {
  constructor() {
    if (AudioStore.instance) {
      return AudioStore.instance;
    }
    AudioStore.instance = this;

    this.subscribers = [];
    this.isPlaying = false;
    this.isMuted = false;
    this.isLoading = false;
    this.volume = 1;
    this.error = null;

    // URL del streaming
    this.streamUrl = 'https://radio.saopaulo01.com.br/8000/stream';

    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';
    
    // Configurar event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.audio.addEventListener('playing', () => {
      console.log('Audio playing event');
      this.isPlaying = true;
      this.isLoading = false;
      this.error = null;
      this.notify();
    });

    this.audio.addEventListener('pause', () => {
      console.log('Audio pause event');
      this.isPlaying = false;
      this.isLoading = false;
      this.notify();
    });

    this.audio.addEventListener('waiting', () => {
      console.log('Audio waiting/buffering');
      this.isLoading = true;
      this.notify();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.isLoading = false;
      this.error = e.message || 'Error de reproducción';
      this.isPlaying = false;
      this.notify();
    });

    this.audio.addEventListener('volumechange', () => {
      console.log('Volume changed:', this.audio.volume, 'Muted:', this.audio.muted);
      this.volume = this.audio.volume;
      this.isMuted = this.audio.muted;
      this.notify();
    });

    // Añadir listener para detectar cuando el stream está listo
    this.audio.addEventListener('canplay', () => {
      console.log('Stream ready to play');
      this.isLoading = false;
      this.error = null;
      this.notify();
    });
  }

  async togglePlay() {
    try {
      if (!this.audio.src) {
        console.log('Iniciando stream con:', this.streamUrl);
        this.audio.src = this.streamUrl;
        this.audio.load();
      }

      if (this.isPlaying) {
        await this.audio.pause();
        this.isPlaying = false;
      } else {
        this.isLoading = true;
        this.notify();
        await this.audio.play();
        this.isPlaying = true;
      }
      console.log('Toggle play - isPlaying:', this.isPlaying);
      this.notify();
    } catch (error) {
      console.error('Error toggling play:', error);
      this.isLoading = false;
      this.error = error.message;
      this.notify();
    }
  }

  async stopPlay() {
    try {
      if (this.audio.src) {
        this.audio.pause();
        this.audio.src = '';
        this.audio.load();
        this.isPlaying = false;
        this.isLoading = false;
        this.notify();
        console.log('Stream detenido completamente');
      }
    } catch (error) {
      console.error('Error stopping play:', error);
      this.error = error.message;
      this.notify();
    }
  }

  setVolume(value) {
    this.audio.volume = value;
    console.log('Setting volume:', value);
    this.volume = value;
    this.notify();
  }

  toggleMute() {
    this.audio.muted = !this.audio.muted;
    console.log('Toggling mute:', this.audio.muted);
    this.isMuted = this.audio.muted;
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    // Notificar estado inicial inmediatamente
    callback({
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.volume,
      isLoading: this.isLoading,
      error: this.error
    });
    
    // Retornar función para desuscribirse
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    const state = {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.volume,
      isLoading: this.isLoading,
      error: this.error
    };
    console.log('Notifying state:', state);
    this.subscribers.forEach(callback => callback(state));
  }
}

// Crear una única instancia del store
const audioStore = new AudioStore();
export default audioStore; 