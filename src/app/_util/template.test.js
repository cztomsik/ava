import test from "node:test"
import assert from "node:assert"
import { template, parseVars } from "./template"

test("template", () => {
  assert.strictEqual(template("{{foo}}", { foo: "bar" }), "bar")
  assert.strictEqual(template("{{foo}}", { foo: 0 }), "0")
  assert.strictEqual(template("{{foo}}", { foo: null }), "")
  assert.strictEqual(template("{{foo}}", { foo: undefined }), "")
  assert.strictEqual(template("{{ foo }}", { foo: "bar" }), "bar")

  assert.strictEqual(template("{{#foo}}bar{{/foo}}", { foo: true }), "bar")
  assert.strictEqual(template("{{#foo}}bar{{/foo}}", { foo: false }), "")

  assert.strictEqual(template("{{^foo}}bar{{/foo}}", { foo: true }), "")
  assert.strictEqual(template("{{^foo}}bar{{/foo}}", { foo: false }), "bar")

  assert.strictEqual(template("{{#a}}foo{{#b}}bar{{/b}}{{/a}}", { a: true, b: true }), "foobar")
  assert.strictEqual(template("{{#a}}foo{{#b}}bar{{/b}}{{/a}}", { a: true, b: false }), "foo")
  assert.strictEqual(template("{{#a}}foo{{#b}}bar{{/b}}{{/a}}", { a: false, b: true }), "")

  const tpl = `
    Hello {{value}}!
    {{#cond}} {{value}}{{/cond}}{{^cond}} Fallback{{/cond}}
  `

  assert.strictEqual(
    template(tpl, { value: "World", cond: true }).trim(),
    `Hello World!
     World`.trim()
  )

  assert.strictEqual(
    template(tpl, { value: "World", cond: false }).trim(),
    `Hello World!
     Fallback`.trim()
  )
})

test("parseVars", () => {
  assert.deepStrictEqual(parseVars("foo"), [])
  assert.deepStrictEqual(parseVars("{{foo}}"), ["foo"])
  assert.deepStrictEqual(parseVars("{{foo}} {{bar}}"), ["foo", "bar"])
  assert.deepStrictEqual(parseVars("{{ foo }}"), ["foo"])
  assert.deepStrictEqual(parseVars("{{#a}}foo{{#b}}bar{{/b}}{{/a}}"), ["a", "b"])
  assert.deepStrictEqual(parseVars("{{^a}}foo{{^b}}bar{{/b}}{{/a}}"), ["a", "b"])
})
