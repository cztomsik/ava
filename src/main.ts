import { db } from "./db"
import { version } from "./_macros/version" assert { type: "macro" }
import { embedFile, embedBundle } from "./_macros/embed" assert { type: "macro" }

const resources = [
  await embedFile("index.html"),
  await embedFile("../node_modules/bootstrap/dist/css/bootstrap.min.css"),
  await embedBundle("main.tsx"),
]

const server = Bun.serve({
  async fetch(req) {
    let { pathname } = new URL(req.url)
    if (pathname == "/") pathname = "/index.html"

    for (const f of resources) {
      if (pathname === `/${f.basename}`) {
        // @ts-expect-error
        return new Response(f.body ?? atob(f.base64), {
          headers: { "content-type": f.contentType },
        })
      }
    }

    return new Response(`Not found`, { status: 404 })
  },
})

console.log(`
 /\\ \\  / /\\             Free alpha version
/--\\ \\/ /--\\  v${version()}    http://localhost:${server.port}
_____________________________________________

target: ${process.platform} ${process.arch}
sqlite: ${db.query("select sqlite_version()").values()[0]}
`)
