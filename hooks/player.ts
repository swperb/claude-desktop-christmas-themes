import type { EngineInterface } from 'claude-code'

// The music bed. With ffplay (ffmpeg) installed it plays from any point, so
// pause and volume changes pick up where the music was; otherwise it falls back
// to macOS's afplay, which can only start a track from the top.

const AUDIO = /\.(mp3|m4a|aac|wav|aiff?|flac)$/i
const FFPLAY = ['/opt/homebrew/bin/ffplay', '/usr/local/bin/ffplay', '/usr/bin/ffplay']
const AFPLAY = '/usr/bin/afplay'

export type Track = { name: string; path: string }

type Running = {
  startedAt: number
  offset: number
  stop: () => void
}

let generation = 0
let running: Running | undefined
let duration: number | undefined
let ffplay: string | null | undefined

/** Where music is looked for: a folder that survives plugin updates, then the plugin's own. */
export async function musicFolders($: EngineInterface): Promise<string[]> {
  const home = await $.env.get('HOME')
  return [...(home ? [`${home}/Music/Claude Christmas`] : []), `${$.plugin.root}/music`]
}

export async function findTrack($: EngineInterface): Promise<Track | undefined> {
  for (const dir of await musicFolders($)) {
    if (!(await $.fs.exists(dir))) continue
    const name = (await $.fs.list(dir))
      .filter(entry => entry.kind === 'file' && AUDIO.test(entry.name))
      .map(entry => entry.name)
      .sort()[0]
    if (name !== undefined) return { name, path: `${dir}/${name}` }
  }
  return undefined
}

export async function findFfplay($: EngineInterface): Promise<string | null> {
  if (ffplay !== undefined) return ffplay
  ffplay = null
  for (const candidate of FFPLAY) {
    if (await $.fs.exists(candidate)) {
      ffplay = candidate
      break
    }
  }
  return ffplay
}

async function trackDuration($: EngineInterface, player: string, track: Track): Promise<number | undefined> {
  if (duration !== undefined) return duration
  const probe = player.replace(/ffplay$/, 'ffprobe')
  try {
    const { exitCode, stdout } = await $.process.run(
      [probe, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', track.path],
      { timeoutMs: 15_000 },
    )
    const seconds = Number.parseFloat(stdout)
    if (exitCode === 0 && Number.isFinite(seconds) && seconds > 0) duration = seconds
  } catch {
    // No ffprobe: positions just aren't wrapped at the track's end.
  }
  return duration
}

export function isPlaying(): boolean {
  return running !== undefined
}

/** Seconds into the track right now (or where it was paused). */
export function position(saved: number): number {
  if (running === undefined) return saved
  const at = running.offset + (Date.now() - running.startedAt) / 1000
  return duration !== undefined ? at % duration : at
}

export function stop(): void {
  generation++
  running?.stop()
  running = undefined
}

/**
 * Starts the track at `offset` seconds (ffplay) or from the top (built-in),
 * looping forever. `onFail` hears why when it can't play.
 */
export async function play(
  $: EngineInterface,
  track: Track,
  offset: number,
  volume: number,
  onFail: (why: string) => void,
): Promise<'ffplay' | 'builtin'> {
  stop()
  const mine = ++generation
  const ff = await findFfplay($)
  const kind = ff === null ? 'builtin' : 'ffplay'

  let from = 0
  let argv: string[]
  if (ff !== null) {
    const total = await trackDuration($, ff, track)
    from = total !== undefined && offset >= total - 1 ? 0 : Math.max(0, offset)
    argv = [ff, '-nodisp', '-autoexit', '-loglevel', 'error', '-ss', from.toFixed(2), '-volume', String(Math.round(volume)), track.path]
  } else {
    // macOS's own player: no seeking, so it starts from the top.
    argv = [AFPLAY, '-v', (volume / 100).toFixed(2), track.path]
  }
  if (mine !== generation) return kind

  const startedAt = Date.now()
  const stream = $.process.spawn({ argv })
  running = { startedAt, offset: from, stop: () => void stream.return(undefined as never) }

  void (async () => {
    let failure: string | undefined
    try {
      for await (const chunk of stream) {
        if (chunk.stream === 'stderr' && chunk.text.trim() !== '') failure = chunk.text.trim()
      }
    } catch (err) {
      failure = err instanceof Error ? err.message : String(err)
    }
    if (mine !== generation) return // paused, re-volumed or unloaded on purpose
    running = undefined
    if ((Date.now() - startedAt) / 1000 < 3) {
      onFail(failure ?? `${kind === 'ffplay' ? 'ffplay' : 'afplay'} stopped right away`)
      return
    }
    // Reached the end of the track: go round again from the top.
    await play($, track, 0, volume, onFail)
  })()

  return kind
}
