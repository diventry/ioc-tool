const fs = require('fs')
const axios = require("axios")
const cliProgress = require('cli-progress')
const readline = require("readline")
const prettyjson = require('prettyjson');

async function DownloadToStream(shareToken, output, options) {
    try {
        var response = await axios({
            method: 'get',
            url: `${GetNetwork()}/download/ip/${shareToken}.txt?ipv4=${!options.noIPv4}&ipv6=${!options.noIPv6}&comments=${!options.noComments}`,
            responseType: 'stream'
        });
        response.data.pipe(output);
    } catch (e) {
        return (e.message)
    }
    return (null)
}

var ApiPath = '/api/';

const Networks = ['https://api.diventry.com']


function PrettyShow(data, mode = "pretty") {
    if (mode === "pretty")
        console.log(prettyjson.render(data, {}));
    else
        console.log(JSON.stringify(data))
}

function GetNetwork() {
    return (Networks[0])
}

function SetNetwork(array) {
    do { } while (Networks.shift())
    array.map((a) => {
        Networks.push(a);
    })
}

async function Get(resource, ttl = 0) {
    const url = `${GetNetwork()}${ApiPath}${resource}`
    // console.log("Calling: "+url)
    try {
        var response = await axios.get(url)
        return (response.data)
    } catch (e) {
        return ({
            error: e.message
        })
    }
}

async function Post(resource, data, ttl = 0) {
    // console.log(`${GetNetwork()}${ApiPath}${resource}`)
    try {
        var response = await axios.post(`${GetNetwork()}${ApiPath}${resource}`, data)

        return (response.data)
    } catch (e) {
        return ({
            error: e.message
        })
    }
}

function Init(options) {

    if (options.api)
        ApiPath = options.api;

    if (process.env.API_KEY)
        axios.defaults.headers.common['Authorization'] = process.env.API_KEY

    if (!options.server && process.env.SERVER)
        SetNetwork([process.env.SERVER])
    else if (options.server) {
        const net = [];
        const t = options.server.split(",");
        t.map((e) => {
            net.push(e.trim())
        })
        SetNetwork(net);
    }
}

function RouteNetwork(rcs) {
    return (`${GetNetwork()}${ApiPath}${rcs}`)
}

async function SendFile(file, bulk = 100, useProgress = true, useDeDup = true) {
    return (new Promise(async (accept) => {

        // cela ne pose pas de soucis de faire du dédoublage sur un hash
        // il peut encaisser plusieurs millions d'entrées et peut être
        // optimisé pour une usage plus large. Le cas échéant utiliser Level
        const deDup = {}
        const lastFile = `${file}.last`
        if (useDeDup !== false && process.env.FULL !== "yes") {
            // load last file
            try {
                const lines = fs.readFileSync(lastFile).toString().split("\n")
                for (var line of lines) {
                    deDup[line] = true
                }

                console.log(`Last file loaded ${lastFile}`)
            } catch (e) { }
        }

        /// process file
        const allIps = []
        var counter = 0
        var processed = 0
        var stop = false

        var progress

        if (useProgress === true)
            progress = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

        async function dump() {
            if (allIps.length === 0 && stop === true) {
                if (useProgress === true) {
                    progress.stop()
                    console.log(`Saving last file to ${lastFile}`)
                    fs.renameSync(file, lastFile)
                }
                accept()
                return
            }

            const packet = {
                ips: []
            }

            for (var a = 0; a < parseInt(bulk); a++) {
                const item = allIps.shift()
                if (!item) break
                packet.ips.push(item)
                processed++
            }

            if (useProgress === true)
                progress.update(processed)

            const ret = await Post("ioc/rx", packet)
            if (ret.error) {
                if (useProgress === true) {
                    progress.stop()
                    console.log(ret)
                }
                accept(ret.error)
                return
            }
            setTimeout(dump, 100)
        }
        setTimeout(dump)

        try {
            console.log(`Reading ${file}`)
            const rl = readline.createInterface({
                input: fs.createReadStream(file),
                crlfDelay: Infinity
            });

            rl.on('line', (line) => {
                if (useDeDup === true && deDup[line] === true) return
                // console.log(deDup[line], line)
                // line += " scanner,trickbot"
                const sep = line.trim().split(" ")
                if (sep.length === 0) return

                const item = {}
                item.ip = sep[0]
                sep.shift()
                const tags = sep
                    .join(" ")
                    .split(",")
                    .map((a) => a.trim())
                    .filter((a) => a.length > 0)
                if (tags.length > 0) item.tags = tags
                if (item.ip.length === 0) return
                allIps.push(item)
                counter++
                if (useProgress === true)
                    progress.start(counter, processed)
            });

            rl.on('close', () => {
                stop = true
            })
        } catch (err) {
            console.error(err);
        }
    }))

}

module.exports = {
    Init,
    Get,
    Post,
    ApiPath,
    GetNetwork,
    // SetNetwork,
    RouteNetwork,
    SendFile,
    PrettyShow,
    DownloadToStream
}
