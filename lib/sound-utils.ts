// Sound utility for playing notification sounds
export class SoundManager {
  private static instance: SoundManager
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()

  private constructor() {}

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  private async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume()
    }
  }

  // Generate a bell sound using Web Audio API
  async playBellSound() {
    try {
      await this.initAudioContext()
      if (!this.audioContext) return

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Bell-like sound with multiple frequencies
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1)
      oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3)

      // Envelope for natural bell decay
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.5)
    } catch (error) {
      console.warn("Could not play bell sound:", error)
    }
  }

  // Generate a notification beep
  async playNotificationBeep() {
    try {
      await this.initAudioContext()
      if (!this.audioContext) return

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime)
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01)
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.2)
    } catch (error) {
      console.warn("Could not play notification beep:", error)
    }
  }
}

export const soundManager = SoundManager.getInstance()
