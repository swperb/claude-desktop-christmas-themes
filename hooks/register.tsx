import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeBackdropGlass, ThemeSetArgs } from 'claude-code'

import type { ChristmasPanel } from '../types'

import { makeColors } from './make-colors.js'
import { findFfplay, findTrack, isPlaying, play, position, stop } from './player'
import { COZY_FIREPLACE } from './scenes/cozy-fireplace'
import { SNOWY_NIGHT } from './scenes/snowy-night'

// ---------------------------------------------------------------------------
// The collection. Each theme is a palette plus an animated scene. To add one,
// draw a scene in hooks/scenes/, give it colors here, and add it to THEMES.
// ---------------------------------------------------------------------------

type ChristmasTheme = {
  label: string
  blurb: string
  svg: string
  alt: string
  glass: ThemeBackdropGlass
  colors: ReturnType<typeof makeColors>
}

const THEMES: Record<string, ChristmasTheme> = {
  'snowy-night': {
    label: 'Snowy Night',
    blurb: 'Moonlit snowfall, snowmen, a glowing cabin, and Santa crossing the moon now and then.',
    svg: SNOWY_NIGHT,
    alt: 'A moonlit winter night with falling snow, snowmen on the hills, a glowing cabin, and Santa’s sleigh crossing the moon',
    glass: { blur: 18, tint: '#0b1a3a', opacity: 0.58 },
    colors: makeColors({
      label: 'Christmas: Snowy Night',
      only: 'dark',
      roles: { accent: '#6fb0f0', danger: '#ec5a60', success: '#5cc283', warning: '#e8b04a', pro: '#b29af0' },
      dark: {
        gray: {
          anchors: {
            'surface-0': '#0b1630',
            'surface-1': '#111f3e',
            'surface-2': '#16264a',
            'surface-3': '#18294d',
            'text-primary': '#eef4ff',
            'text-secondary': '#c3d3ee',
            'text-muted': '#9db2d6',
          },
        },
      },
    }),
  },
  'cozy-fireplace': {
    label: 'Cozy Fireplace',
    blurb: 'A crackling fire, stockings on the mantel, a sleeping cat, a twinkling tree, and snow past the window.',
    svg: COZY_FIREPLACE,
    alt: 'A cozy living room at night with a crackling brick fireplace, stockings on the mantel, a cat asleep on the rug, a lit Christmas tree with presents, and snow falling outside the window',
    glass: { blur: 18, tint: '#1e120e', opacity: 0.6 },
    colors: makeColors({
      label: 'Christmas: Cozy Fireplace',
      only: 'dark',
      roles: { accent: '#f0a04b', danger: '#ec5a52', success: '#6cc07c', warning: '#f2c14e', pro: '#c79be8' },
      dark: {
        gray: {
          anchors: {
            'surface-0': '#1c1210',
            'surface-1': '#251815',
            'surface-2': '#2c1d19',
            'surface-3': '#2f201b',
            'text-primary': '#fbf0e4',
            'text-secondary': '#e3cdb8',
            'text-muted': '#c2a68f',
          },
        },
      },
    }),
  },
}
const DEFAULT_THEME = 'snowy-night'

const PANE = 'christmas'
const VOLUME_STEP = 10
const DEFAULT_VOLUME = 55

// What the pane draws. Bump `shape` when ChristmasPanel's fields change.
const panel = atom({ plugin: 'christmas-themes', key: 'panel' } as const, {
  theme: DEFAULT_THEME,
  isPlaying: false,
  volume: DEFAULT_VOLUME,
  track: null,
  player: 'none',
} satisfies ChristmasPanel as ChristmasPanel, { shape: 'panel-1' })

async function currentTheme($: EngineInterface): Promise<string> {
  const stored = await $.store.get('theme')
  return typeof stored === 'string' && stored in THEMES ? stored : DEFAULT_THEME
}

async function storedVolume($: EngineInterface): Promise<number> {
  const stored = await $.store.get('volume')
  return typeof stored === 'number' && stored >= 0 && stored <= 100 ? stored : DEFAULT_VOLUME
}

async function storedPosition($: EngineInterface): Promise<number> {
  const stored = await $.store.get('position')
  return typeof stored === 'number' && stored >= 0 ? stored : 0
}

async function applyTheme($: EngineInterface, id: string) {
  const t = THEMES[id] ?? THEMES[DEFAULT_THEME]!
  const unpainted = t.colors.problems.find(line => line.startsWith("Desktop won't paint"))
  if (unpainted !== undefined) $.ui.toast(`christmas-themes: ${unpainted}`)

  const look: ThemeSetArgs = {
    colors: t.colors.theme,
    backdrop: { scene: id, glass: t.glass },
  }
  const set = await $.theme.set(look)
  await update($, panel, p => ({ ...p, theme: id }))
  return set
}

async function switchTheme($: EngineInterface, id: string) {
  await $.store.set('theme', id)
  return applyTheme($, id)
}

// ---------- music ----------

async function startMusic($: EngineInterface): Promise<string> {
  const track = await findTrack($)
  if (track === undefined) {
    await update($, panel, p => ({ ...p, isPlaying: false, track: null, player: 'none' as const }))
    return 'No music yet: drop an audio file into ~/Music/Claude Christmas.'
  }
  const volume = await storedVolume($)
  const from = await storedPosition($)
  const player = await play($, track, from, volume, why => {
    void update($, panel, p => ({ ...p, isPlaying: false }))
    $.ui.toast(`Christmas music couldn’t play: ${why}`)
  })
  await $.store.set('music', true)
  await update($, panel, p => ({ ...p, isPlaying: true, volume, track: track.name, player }))
  return `Playing ${track.name}.`
}

async function pauseMusic($: EngineInterface): Promise<string> {
  const at = position(await storedPosition($))
  stop()
  await $.store.set('position', at)
  await $.store.set('music', false)
  await update($, panel, p => ({ ...p, isPlaying: false }))
  return 'Christmas music paused.'
}

async function setVolume($: EngineInterface, volume: number) {
  const v = Math.max(0, Math.min(100, Math.round(volume)))
  await $.store.set('volume', v)
  await update($, panel, p => ({ ...p, volume: v }))
  // A running player takes a new volume by restarting where it is.
  if (isPlaying()) {
    await $.store.set('position', position(await storedPosition($)))
    await startMusic($)
  }
}

async function refreshTrack($: EngineInterface) {
  const track = await findTrack($)
  const player: ChristmasPanel['player'] = track === undefined ? 'none' : (await findFfplay($)) === null ? 'builtin' : 'ffplay'
  await update($, panel, p => ({ ...p, track: track?.name ?? null, player }))
}

function listing(active: string): string {
  return Object.entries(THEMES)
    .map(([id, t]) => `${id === active ? '●' : '○'} ${id}: ${t.label}. ${t.blurb}`)
    .join('\n')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'christmas',
      description: 'Christmas themes: open the control pane, switch theme, or control the music',
      argumentHint: '[list | <theme> | music on|off|pause | volume 0-100]',
    })

    const set = await applyTheme($, await currentTheme($))
    if (!set.isDrawn) $.ui.status(set.reason)

    const volume = await storedVolume($)
    await update($, panel, p => ({ ...p, volume }))
    await refreshTrack($)
    if ((await $.store.get('music')) !== false) await startMusic($)

    void $.ui.open({ id: PANE, title: 'Christmas' })

    return next(e)
  })

  on('session.end', async ($, e, next) => {
    if (isPlaying()) await $.store.set('position', position(await storedPosition($)))
    stop()
    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    const t = THEMES[e.props.scene]
    if (t === undefined || (e.surface !== 'desktop' && e.surface !== 'mobile')) return next(e)
    const { Svg } = $.ui.resolve(e)
    return <Svg source={t.svg} alt={t.alt} isInteractive />
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const p = await read($, panel)
    const filled = Math.round(p.volume / 10)

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold>Theme</Text>
          {Object.entries(THEMES).map(([id, t]) => (
            <Button
              key={`theme-${id}`}
              label={`${id === p.theme ? '● ' : '○ '}${t.label}`}
              variant={id === p.theme ? 'primary' : 'secondary'}
              onPress={() => void switchTheme($, id)}
            />
          ))}
        </Box>

        <Box flexDirection="column">
          <Text bold>Music</Text>
          {p.track === null ? (
            <Text dimColor>No track yet. Drop an audio file into ~/Music/Claude Christmas, then press Play.</Text>
          ) : (
            <Text dimColor>{p.track}</Text>
          )}
          <Box flexDirection="row" gap={1}>
            <Button
              key="play"
              label={p.isPlaying ? '❚❚ Pause' : '▶ Play'}
              variant="primary"
              hotkey="p"
              onPress={() => void (isPlaying() ? pauseMusic($) : startMusic($))}
            />
            <Button key="quieter" label="− Quieter" onPress={() => void setVolume($, p.volume - VOLUME_STEP)} />
            <Button key="louder" label="+ Louder" onPress={() => void setVolume($, p.volume + VOLUME_STEP)} />
          </Box>
          <Text>
            Volume {"■".repeat(filled)}<Text dimColor>{"□".repeat(10 - filled)}</Text> {p.volume}%
          </Text>
          {p.player === 'builtin' && (
            <Text dimColor>Pause and volume restart the track. Install ffmpeg to resume where it left off.</Text>
          )}
        </Box>
      </Box>
    )
  })

  on('command.run', { command: 'christmas' }, async ($, e) => {
    const [first = '', second = ''] = e.args.trim().toLowerCase().split(/\s+/).filter(Boolean)

    if (first === '') {
      await refreshTrack($)
      await $.ui.open({ id: PANE, title: 'Christmas' })
      return { text: 'Christmas pane opened.' }
    }

    if (first === 'music') {
      if (second === 'off' || second === 'pause' || (second === '' && isPlaying())) return { text: await pauseMusic($) }
      return { text: await startMusic($) }
    }

    if (first === 'volume') {
      const v = Number.parseInt(second, 10)
      if (!Number.isFinite(v)) return { text: `Volume is ${(await read($, panel)).volume}%. Use /christmas volume 0-100.` }
      await setVolume($, v)
      return { text: `Volume ${Math.max(0, Math.min(100, v))}%.` }
    }

    if (first === 'list') {
      const active = await currentTheme($)
      return { text: `${listing(active)}\n\nMusic: ${isPlaying() ? 'playing' : 'paused'}.` }
    }

    const chosen = THEMES[first]
    if (chosen !== undefined) {
      const set = await switchTheme($, first)
      return { text: set.isDrawn ? `Switched to ${chosen.label}.` : `Saved ${chosen.label}, but: ${set.reason}` }
    }

    return { text: `No theme called "${first}".\n${listing(await currentTheme($))}` }
  })
}
