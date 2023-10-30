

const sc = require('subcommander')
const fs = require('fs')
const axios = require("axios")
const readline = require('readline')
const { Init, Post } = require("../index")

const { Tail } = require('tail')

const bulk = 100
sc.command('watch', {
    desc: 'Watch system files',
    callback: async function (options) {
        Init(options)

        const kernel = {
            files: {},
            ips: {},
            domains: {}
        }

        const modules = {}

        kernel.addFile = (file, interpretor, oneShot = false) => {
            if (!kernel.files[file])
                kernel.files[file] = []
            kernel.files[file].push({ interpretor, oneShot })
        }


        kernel.markDomain = (domain, tags = []) => {

        }


        kernel.markIP = (ip, tags = []) => {
            if (!kernel.ips[ip])
                kernel.ips[ip] = {}
            for (var tag of tags) {
                if (!kernel.ips[ip][tag])
                    kernel.ips[ip][tag] = 0
                kernel.ips[ip][tag]++
            }

            // console.log(ip)
        }

        // period send
        async function dump() {

            const ips = kernel.ips
            kernel.ips = {}

            const domains = kernel.domains
            kernel.domains = {}

            var rest = Object.keys(ips).length + Object.keys(domains).length
            do {
                const packet = {
                    ips: [],
                    domains: []
                }

                for (var a = 0; a < bulk; a++) {
                    const key = Object.keys(ips).shift()
                    if (!key) break
                    packet.ips.push({
                        ip: key,
                        tags: Object.keys(ips[key])
                    })
                    delete ips[key]
                    rest--
                }

                for (var a = 0; a < bulk; a++) {
                    const key = Object.keys(domains).shift()
                    if (!key) break
                    packet.domains.push({
                        ip: key,
                        tags: Object.keys(domains[key])
                    })
                    delete domains[key]
                    rest--
                }

                if (packet.ips.length > 0 || packet.domains.length > 0) {
                    if (packet.ips.length === 0)
                        delete packet.ips
                    if (packet.domains.length === 0)
                        delete packet.domains

                    const ret = await Post("ioc/rx", packet)
                    if (ret.error) {
                        // reinject IPs
                        for (item of packet.ips)
                            kernel.markIP(item.ip, item.tags)
                        console.log("Will retry later")
                    }
                }

                await new Promise((accept) => setTimeout(accept, 500))

            } while (rest > 0)

            setTimeout(dump, 1000)
        }
        setTimeout(dump, 1000)

        // load module
        const moduleDirs = [__dirname + "/modules"]
        for (var moduleDir of moduleDirs) {
            const dirs = fs.readdirSync(moduleDir)
            for (var dir of dirs) {
                const file = `${moduleDir}/${dir}`
                try {
                    const obj = require(file)
                    modules[obj.name] = obj
                    console.debug(`Loading module ${obj.name}`)
                    await obj.init(kernel)
                } catch (e) {
                    console.log(`Can not load ${file}: ${e.message}`)
                }
            }
        }

        // activate file monitoring
        console.log(`Loading files`)
        for (let file in kernel.files) {
            const interpretors = kernel.files[file]
            try {
                const st = fs.statSync(file);

                var oneShot = true
                for (var op of interpretors) {
                    if (op.oneShot !== true) {
                        oneShot = false
                        break
                    }
                }

                console.log(`Pre building shot=${oneShot} ${file}`)
                await new Promise((accept) => {
                    const rl = readline.createInterface({
                        input: fs.createReadStream(file),
                        crlfDelay: Infinity
                    })

                    rl.on('line', async (line) => {
                        for (var op of interpretors)
                            await op.interpretor(kernel, line)
                    });
                    rl.on('close', accept)
                })

                if (oneShot === true) continue

                console.log(`Watching ${file}`)
                const tail = new Tail(file)

                tail.on("line", async (line) => {
                    for (var op of interpretors)
                        await op.interpretor(kernel, line)
                })

                tail.on("error", function (error) {
                    console.log('ERROR: ', error);
                })

            } catch (e) { }

        }

    }
})
