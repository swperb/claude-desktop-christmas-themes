/** What the Christmas pane draws: the theme in use and the music player's state. */
export type ChristmasPanel = {
  theme: string
  isPlaying: boolean
  /** 0 to 100. */
  volume: number
  /** The track's file name, or null when the music folder holds none. */
  track: string | null
  /** `ffplay` resumes where it paused; `builtin` restarts the track; `none` has nothing to play. */
  player: 'ffplay' | 'builtin' | 'none'
}

declare module 'claude-code' {
  interface PluginState {
    'christmas-themes': { panel: Shaped<ChristmasPanel> }
  }
}
