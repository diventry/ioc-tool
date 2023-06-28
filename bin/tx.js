

const sc = require('subcommander');
const fs = require('fs');
const zlib = require('zlib');
const readline = require("readline");
const axios = require("axios");
const cliProgress = require('cli-progress');
const crypto = require('crypto');

const { Init, Post } = require("../index");

const tx = sc.command('tx', {
    desc: 'Transmission'
})

const ip = tx.command('ip', {
    desc: 'IP related commands'
})

ip.command('single', {
    desc: 'Send single IP ',
    callback: async function (options) {
        Init(options);

        const packet = {
            ips: []
        }
        const item = {}
        item.ip = options[0]
        if (!item.ip) {
            console.log("Please sepcify an IP")
            process.exit(-1)
        }

        const tags = options.tags.split(",").map((a) => a.trim()).filter((a) => a.length > 0)
        if (tags.length > 0) item.tags = tags

        packet.ips.push(item)
        const ret = await Post("ioc/rx", packet)
        console.log(ret)
    }
}).option('tags', {
    abbr: 't',
    desc: 'IP tags separed by ,',
    default: ``
})

ip.command('plaintext', {
    desc: 'Send big file',
    callback: async function (options) {
        Init(options);

        const allIps = []
        var counter = 0
        var processed = 0
        var stop = false

        const progress = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

        async function dump() {
            if (allIps.length === 0 && stop === true) {
                progress.stop()
                console.log('Injection done');
                const used = process.memoryUsage().heapUsed / 1024 / 1024;
                console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
                process.exit(0)
            }

            const packet = {
                ips: []
            }

            for (var a = 0; a < parseInt(options.bulk); a++) {
                const item = allIps.shift()
                if (!item) break
                packet.ips.push(item)
                processed++
            }

            progress.update(processed)

            const ret = await Post("ioc/rx", packet)
            if (ret.error) {
                progress.stop()
                console.log(ret)
                process.exit(-1)
            }
            setTimeout(dump, 100)
        }
        setTimeout(dump)
        
        try {
            const rl = readline.createInterface({
                input: fs.createReadStream(options[0]),
                crlfDelay: Infinity
            });

            rl.on('line', (line) => {
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
                progress.start(counter, processed)
            });

            rl.on('close', () => {
                stop = true
            })
        } catch (err) {
            console.error(err);
        }
    }
}).option('bulk', {
    abbr: 'b',
    desc: 'Bulk size',
    default: 500
})


ip.command('stress', {
    desc: 'Stress test',
    callback: async function (options) {
        Init(options);

        function generateRandomKey(length) {
            const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let key = '';
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * charset.length);
                key += charset[randomIndex];
            }
            return key;
        }

        function generateRandomIP() {
            const buffer = crypto.randomBytes(4); // Génère 4 octets aléatoires

            const ipSegments = [];
            for (let i = 0; i < buffer.length; i++) {
                ipSegments.push(buffer[i]);
            }

            return ipSegments.join('.'); // Combine les segments en une adresse IP
        }

        for (var a = 0; a < options.num; a++) {
            const ip = generateRandomIP()
            const key = [generateRandomKey(6), generateRandomKey(6)]
            console.log(`${ip} ${key.join(",")}`)
        }
    }
}).option('num', {
    abbr: 'n',
    desc: 'Number of IPs',
    default: 1000
})
