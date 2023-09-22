export async function* jsonLines(reader: ReadableStreamDefaultReader<Uint8Array>) {
  for await (const chunk of chunks(reader)) {
    for (const line of chunk.split("\n")) {
      if (line) yield JSON.parse(line)
    }
  }
}

async function* chunks(reader: ReadableStreamDefaultReader<Uint8Array>, decoder = new TextDecoder()) {
  for (let res; !(res = await reader.read()).done; ) {
    yield decoder.decode(res.value)
  }
}
