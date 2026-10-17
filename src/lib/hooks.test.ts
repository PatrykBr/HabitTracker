import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'bun:test'
import { restoreGlobals, stubGlobal } from '../../tests/globals'
import { useOnline } from './hooks'

function ConnectionStatus() {
  return createElement('span', null, useOnline() ? 'Online' : 'Offline')
}

afterEach(restoreGlobals)

describe('connection status during SSR', () => {
  it.each([undefined, {}, { onLine: false }, { onLine: true }])(
    'uses the same initial markup regardless of the host navigator (%j)',
    (navigatorValue) => {
      stubGlobal('navigator', navigatorValue)
      expect(renderToString(createElement(ConnectionStatus))).toBe(
        '<span>Online</span>',
      )
    },
  )
})
