#!/usr/bin/env node

const sc = require('subcommander');
const os = require('os');
const fs = require('fs');
const ioc = require("../index")
const { mkdirp } = require("mkdirp")
const axios = require("axios");

axios.postCheck = async function (a, b, c) {

    try {
        const ret = await axios.post(a, b, c);
        if (!ret) {
            console.log("Null return")
            process.exit(-1)
        }
        if (!ret.data && ret.data.error) {
            console.log(ret.data)
            process.exit(-1)
        }

        return (ret.data)
    } catch (e) {
        console.log(e.message)
        process.exit(-1)
    }
}

sc.option('dataDir', {
    abbr: 'd',
    desc: 'Data directory',
    default: `${os.homedir()}/.ioc-tool`
});

sc.option('server', {
    abbr: 's',
    desc: 'Diventry servers to use',
    default: `https://api.diventry.com`
});

sc.option('api', {
    abbr: 'a',
    desc: 'API Path',
    default: `/api/`
});

sc.command('api', {
    desc: 'Set and save the API key',
    callback: async function (options) {
        ioc.Init(options);

        if (!options[0] || options[0].length === 0) {
            console.log(`Please specify your API key`)
            process.exit(-1)
        }

        const newConfig = {
            apiKey: options[0],
            dataDir: options.dataDir,
            server: options.server,
            api: options.api,
        }

        const filename = `${options.dataDir}/config.json`
        await mkdirp(options.dataDir)

        fs.writeFileSync(filename, JSON.stringify(newConfig, null, " "))

        console.log(`Configuration saved in ${filename}`)
    }
})

require("./tx")
require("./download")
require("./ipset")
require("./list")
require("./info")
require("./watch")

sc.parse()


