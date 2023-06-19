const sc = require('subcommander');
const fs = require('fs');
const readline = require("readline");
const axios = require("axios");

const { Init, RouteNetwork } = require("../index");

sc.command('download', {
    desc: 'Retrieve a list',
    callback: async function (options) {
        Init(options);

        try {
            var response = await axios({
                method: 'get',
                url: RouteNetwork(`ioc/download/tagged/${options.list}.txt`),
                responseType: 'stream'
            })
            const rl = readline.createInterface({
                input: response.data
            });
            rl.on('line', async (input) => {
                console.log(`${input}`)
            });

        } catch (e) {
            console.error(e.message)
            process.exit(-1)
        }
    }
}).option('list', {
    abbr: 'l',
    desc: 'Which list to download',
    default: "main-stream"
})
