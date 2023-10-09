const sc = require('subcommander');
const fs = require('fs');
const readline = require("readline");
const axios = require("axios");
const Table = require('cli-table3');

const { Init, RouteNetwork } = require("../index");

sc.command('list', {
    desc: 'Retrieve list of threat intelligence',
    callback: async function (options) {
        Init(options);

        try {
            var table = new Table({
                head: ['Name', 'Last Update', 'IPs', 'Domains', 'Share Token']
            });

            var response = await axios({
                method: 'get',
                url: RouteNetwork(`ioc/public/lists`),
            })

            for (var list of response?.data?.data) {
                table.push([
                    list.name,
                    new Date(list.updatedAt).toLocaleString(),

                    list.ipDownloads.length === 0 || list.ipDownloads[0].total === 0 ? 'No' : `Yes (${list.ipDownloads[0].total})`,
                    list.domainDownloads.length === 0 || list.domainDownloads[0].total === 0 ? 'No' : `Yes (${list.domainDownloads[0].total})`,
                    list.shareToken
                ])
            }

            console.log(table.toString());
        } catch (e) {
            // Display error message if request fails
            console.error(e.message);
            process.exit(-1);
        }
    }
})