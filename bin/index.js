#!/usr/bin/env node

const sc = require('subcommander');
const os = require('os');
const fs = require('fs');
const ioc = require("../index")

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

    return(ret.data)
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


// sc.option('configFile', {
//     abbr: 'f',
//     desc: 'Configuration file',
//     default: `${os.homedir()}/.diventry/config.js`
// });

// sc.command('server', {
//     desc: 'Run the main server',
//     callback: async function (options) {
//         const kernel = new divent({ configFile: options.configFile })
//         await kernel.start()
//     }
// })

// sc.command('key', {
//     desc: 'Build 32bytes key',
//     callback: async function (options) {
//         const key = crypto.randomBytes(32).toString("base64")
//         console.log(key)
//     }
// })


require("./tx")
require("./download")
require("./ipset")
require("./list")
require("./info")
require("./watch")

sc.parse()


