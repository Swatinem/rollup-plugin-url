import assert from "assert"
import fs from "fs"
import rimraf from "rimraf"
import rollup from "rollup"
import url from "../"

const dest = "output/output.js"

process.chdir( __dirname );

const svghash = "98ea1a8cc8cd9baf.svg"
const pnghash = "6b71fbe07b498a82.png"

describe("rollup-plugin-url", () => {
  after(() => promise(rimraf, "output/"))
  it("should inline text files", () => {
    return run("./fixtures/svg.js", 10 * 1024)
    .then(() => Promise.all([
      assertOutput(`var svg = "data:image/svg+xml,%3Csvg%3E%3Cpath%20d%3D%22%22%2F%3E%3C%2Fsvg%3E"\n\nexport default svg;`),
      assertExists(`output/${svghash}`, false),
    ]))
  })
  it("should inline binary files", () => {
    return run("./fixtures/png.js", 10 * 1024)
    .then(() => Promise.all([
      assertOutput(`var png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6DwABBQECz6AuzQAAAABJRU5ErkJggg=="\n\nexport default png;`),
      assertExists(`output/${pnghash}`, false),
    ]))
  })
  it("should copy large text files", () => {
    return run("./fixtures/svg.js", 10)
    .then(() => Promise.all([
      assertOutput(`var svg = "${svghash}"\n\nexport default svg;`),
      assertExists(`output/${svghash}`),
    ]))
  })
  it("should copy large binary files", () => {
    return run("./fixtures/png.js", 10)
    .then(() => Promise.all([
      assertOutput(`var png = "${pnghash}"\n\nexport default png;`),
      assertExists(`output/${pnghash}`),
    ]))
  })
  it("should use publicPath", () => {
    return run("./fixtures/png.js", 10, '/foo/bar/')
    .then(() => Promise.all([
      assertOutput(`var png = "/foo/bar/${pnghash}"\n\nexport default png;`),
    ]))
  })
})

function promise(fn, ...args) {
  return new Promise((resolve, reject) =>
                     fn(...args, (err, res) =>
                        err ? reject(err) : resolve(res)))
}

function run(entry, limit, publicPath = '') {
  const plugin = url({limit, publicPath})
  return rollup.rollup({
    entry,
    plugins: [plugin],
  }).then(bundle => bundle.write({
    dest,
  })).then(() => plugin.write({dest}))
}

function assertOutput(content) {
  return promise(fs.readFile, dest, "utf-8")
  .then(fileContent => assert.equal(fileContent, content))
}

function assertExists(name, shouldExist = true) {
  return promise(fs.stat, name)
  .then(stat => true, err => false)
  .then(exists => assert.ok(exists === shouldExist))
}
