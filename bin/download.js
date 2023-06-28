const sc = require('subcommander');
const fs = require('fs');
const readline = require("readline");
const axios = require("axios");

const { Init, GetNetwork, DownloadToStream } = require("../index");



sc.command('download', {
    desc: 'Retrieve a list',
    callback: async function (options) {
        if (!options[0] || options[0].length === 0) {
            // Display error message if no share token is specified
            console.log("Please specify a share token (list) to download");
            console.log("Go to https://app.diventry.com/#/threat-intelligence to make your choice");
            console.log("You can also type: ioc-tool list")
            console.log("If you are an IOC provider, you can use your share token here");
            process.exit(-1);
        }

        Init(options);

        var output = process.stdout;
        if (options.file !== "-") {
            try {
                // Create a write stream to the specified file
                output = fs.createWriteStream(options.file);
            } catch (e) {
                // Display error message if file write fails
                console.error(`Cannot write to ${options.file}: ${e.message}`);
                process.exit(-1);
            }
            console.log(`Writing to ${options.file}`);
        }

        const ret = await DownloadToStream(options[0], output, options)
        if(ret) {
            console.error(ret)
            process.exit(-1)
        }

        if (options.file !== "-")
            console.log(`Write completed`);
    }
}).option('file', {
    abbr: 'f',
    desc: 'Specify a file to store data. Default: STDOUT',
    default: "-"
}).option('noIPv4', {
    abbr: '4',
    desc: 'Remove IPv4 from the downloaded file. Default: false',
    default: false,
    flag: true
}).option('noIPv6', {
    abbr: '6',
    desc: 'Remove IPv6 from the downloaded file. Default: false',
    default: false,
    flag: true
}).option('noComments', {
    abbr: 'c',
    desc: 'Remove all comments from the downloaded file. Default: false',
    default: false,
    flag: true
});
