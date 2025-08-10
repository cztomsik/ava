// Thank you TypeScript, but you are making my life miserable
interface Element {
  previousElementSibling: HTMLElement | null
  nextElementSibling: HTMLElement | null
  focus(): void
  scrollIntoView(): void
}

// so we don't need to typecast event.target every time
interface EventTarget {
  parentElement: HTMLElement | null
  matches(selector: string): boolean
  closest(selector: string): HTMLElement | null
  value: any
  checked: boolean
}

// flags
var DEV: boolean

// preact factory
var h

// macos messaging
var webkit
