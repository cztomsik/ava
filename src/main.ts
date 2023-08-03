import { db } from "./db"
import { version } from "./_macros/version" assert { type: "macro" }

const server = Bun.serve({
  async fetch(req) {
    let { pathname } = new URL(req.url)
    if (pathname == "/") pathname = "/index.html"

    switch (pathname) {
      case "/index.html":
        return new Response(Bun.file(import.meta.dir + pathname))
      case "/bootstrap.css":
        return new Response(Bun.file(import.meta.dir + "/../node_modules/bootstrap/dist/css/bootstrap.min.css"))
      case "/main.tsx":
        const { success, outputs, logs, ...rest } = await Bun.build({ entrypoints: [import.meta.dir + pathname] })

        if (!success) {
          logs.forEach(log => console.log(log))
        }

        return new Response(outputs[0])
      default:
        return new Response(`Not found`, { status: 404 })
    }
  },
})

console.log(`
 /\\ \\  / /\\             Free alpha version
/--\\ \\/ /--\\  v${version()}    http://localhost:${server.port}
_____________________________________________

target: ${process.platform} ${process.arch}
sqlite: ${db.query("select sqlite_version()").values()[0]}
`)
