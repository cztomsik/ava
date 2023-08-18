// so we don't need to typecast event.target every time
interface EventTarget {
  value: any
  matches
}
