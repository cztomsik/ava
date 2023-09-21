import test from "node:test"
import assert from "node:assert"
import { render, serialize } from "../_test-util/env"
import { Markdown } from "./Markdown"

test("hello", () => {
  expectMd(
    "Hello **world**",
    <>
      Hello <strong>world</strong>
    </>
  )
})

const expectMd = (input, output) => {
  const res = render(<Markdown input={input} />)
  assert.strictEqual(serialize(res.childNodes), serialize(render(output)))
}
