const sc = require('subcommander');
const fs = require('fs');
const readline = require("readline");
const axios = require("axios");
const Table = require('cli-table3');

const { Init, RouteNetwork, PrettyShow, GetNetwork } = require("../index");

sc.command('info', {
    desc: 'Retrieve information of a threat intelligence list',
    callback: async function (options) {

        if (!options[0] || options[0].length === 0) {
            // Display error message if no share token is specified
            console.log("Please specify a share token");
            console.log("Go to https://app.diventry.com/#/threat-intelligence to make your choice");
            console.log("You can also type: ioc-tool list")
            console.log("If you are an IOC provider, you can use your share token here");
            process.exit(-1);
        }

        Init(options);

        try {

            var response = await axios({
                method: 'get',
                url: RouteNetwork(`ioc/public/list/${options[0]}`),
            })
            delete response?.data?.data?.ips
            response.data.data.downloadURL = `${GetNetwork()}/download/ip/${options[0]}.txt`
            response.data.data.ipDownload = response?.data?.data?.ipDownloads[0]
            delete response?.data?.data?.ipDownloads
            PrettyShow(response?.data?.data)
        } catch (e) {
            // Display error message if request fails
            console.error(e.message);
            process.exit(-1);
        }
    }
})