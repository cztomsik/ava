interface WeakRef<T> {
  deref(): T | undefined
}

declare var WeakRef: {
  new <T extends object>(target: T): WeakRef<T>
}

// so we don't need to typecast event.target every time
interface EventTarget {
  parentElement: HTMLElement | null
  matches(selector: string): boolean
  closest(selector: string): HTMLElement | null
  value: any
  checked: boolean
}

// feature flags
var DEV: boolean
var NEXT: boolean

// preact factory
var h

// macos messaging
var webkit
