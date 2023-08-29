// so we don't need to typecast event.target every time
interface EventTarget {
  value: any
  matches
}

// feature flags
var DEV: boolean

// preact factory
var h
