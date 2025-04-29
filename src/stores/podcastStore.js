class PodcastStore {
  constructor() {
    if (PodcastStore.instance) {
      return PodcastStore.instance;
    }
    PodcastStore.instance = this;

    this.subscribers = [];
    this.currentPodcast = null;
    this.isPlaying = false;
    this.audio = new Audio();
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.currentPodcast = null;
      this.notify();
    });

    this.audio.addEventListener('error', () => {
      this.isPlaying = false;
      this.currentPodcast = null;
      this.notify();
    });
  }

  async playPodcast(podcastUrl, podcastId) {
    try {
      // Si es el mismo podcast, toggle play/pause
      if (this.currentPodcast === podcastId) {
        if (this.isPlaying) {
          this.audio.pause();
          this.isPlaying = false;
        } else {
          await this.audio.play();
          this.isPlaying = true;
        }
      } else {
        // Si es un podcast diferente
        if (this.isPlaying) {
          this.audio.pause();
        }
        this.audio.src = podcastUrl;
        this.currentPodcast = podcastId;
        await this.audio.play();
        this.isPlaying = true;
      }
      this.notify();
    } catch (error) {
      console.error('Error playing podcast:', error);
      this.isPlaying = false;
      this.currentPodcast = null;
      this.notify();
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    // Notificar estado inicial
    callback({
      isPlaying: this.isPlaying,
      currentPodcast: this.currentPodcast
    });
    
    // Retornar función para desuscribirse
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    const state = {
      isPlaying: this.isPlaying,
      currentPodcast: this.currentPodcast
    };
    this.subscribers.forEach(callback => callback(state));
  }
}

const podcastStore = new PodcastStore();
export default podcastStore; 