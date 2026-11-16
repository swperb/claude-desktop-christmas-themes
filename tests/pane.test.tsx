import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'christmas-themes',
  component: 'Pane',
  requestId: 'christmas',
  props: {
    title: 'Christmas',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

// The test kit has no theme noun, so theme switching is checked in the app.
test('the pane draws theme buttons and music controls, and steps the volume', async ($, on) => {
  mock.store(on)
  on('fs.exists', () => ({ value: false }))

  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Button', key: 'theme-snowy-night' })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'theme-cozy-fireplace' })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'play' })).toBeDefined()
    await ui.unmount()
  }

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'quieter' })
  expect((await ui.find({ type: 'Text', text: /Volume/ }))?.text).toContain('45%')
  await ui.unmount()
})
