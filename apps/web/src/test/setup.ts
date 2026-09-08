import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(cleanup)

Element.prototype.scrollIntoView ??= () => undefined
globalThis.PointerEvent ??= MouseEvent as typeof PointerEvent
HTMLElement.prototype.hasPointerCapture ??= () => false
HTMLElement.prototype.setPointerCapture ??= () => undefined
HTMLElement.prototype.releasePointerCapture ??= () => undefined

class ResizeObserverMock implements ResizeObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
}

globalThis.ResizeObserver ??= ResizeObserverMock
