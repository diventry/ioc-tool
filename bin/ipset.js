const sc = require('subcommander');
const fs = require('fs');
const readline = require("readline");
const crypto = require("crypto");
const axios = require("axios");
const { mkdirp } = require("mkdirp")
const { execSync } = require('child_process');

const { Init, RouteNetwork, DownloadToStream } = require("../index")

var ipset = sc.command('ipset', {
    desc: 'Linux IPset controler'
})

function exec(cmd) {
    console.log(cmd)
    try {
        execSync(cmd, { stdio: 'inherit' })
    } catch (e) { }
}

function idifier(str) {
    const hash = crypto.createHash("sha256")
    hash.update(str)
    const res = hash.digest("hex")
    return (res.substring(res.length - 10))
}

async function init(options) {
    const shareToken = options[0]
    const key = idifier(`DIVENTRY_${shareToken.toUpperCase()}`)

    Init(options);

    await mkdirp(options.dataDir)

    exec(`iptables -D INPUT -j INPUT_${key}`)
    exec(`iptables -D OUTPUT -j OUTPUT_${key}`)
    exec(`iptables -D FORWARD -j FORWARD_${key}`)

    exec(`iptables -F INPUT_${key}`)
    exec(`iptables -F OUTPUT_${key}`)
    exec(`iptables -F FORWARD_${key}`)

    exec(`iptables -N INPUT_${key}`)
    exec(`iptables -N OUTPUT_${key}`)
    exec(`iptables -N FORWARD_${key}`)

    // load blacklist
    const ipsetCurrentFile = `${options.dataDir}/current.ipset`;
    const st = fs.createWriteStream(ipsetCurrentFile);

    const ipsetExecFile = `${options.dataDir}/exec.ipset`;
    const execSt = fs.createWriteStream(ipsetExecFile);

    execSt.write(`create ${shareToken}IP hash:ip family inet hashsize 65536 maxelem 10000000\n`)
    execSt.write(`create ${shareToken}NET hash:net family inet hashsize 65536 maxelem 10000000\n`)

    try {
        const ret = await DownloadToStream(options[0], st, options)
        if (ret) {
            console.error(ret)
            process.exit(-1)
        }

        st.on('finish', () => {
            const list = fs.readFileSync(ipsetCurrentFile, "utf-8").split('\n')
            list.forEach((el) => {
                if (el.length === 0) return;
                if (el[0] === '#') return;
                const spl = el.split("/")
                if (spl.length === 1)
                    execSt.write(`add ${shareToken}IP ${el}\n`);
                else if (spl.length === 2)
                    execSt.write(`add ${shareToken}NET ${el}\n`);
            })
            st.close();
            execSt.close(() => {
                exec(`ipset flush ${shareToken}IP`)
                exec(`ipset flush ${shareToken}NET`)
                exec(`ipset restore -! < ${ipsetExecFile}`)

                // exec(`iptables -A OUTPUT_${key} -m set --match-set ${shareToken}NET dst -j LOG --log-prefix "${key}-OUTPUT "`)
                // exec(`iptables -A OUTPUT_${key} -m set --match-set ${shareToken}NET dst -j DROP`)

                exec(`iptables -A OUTPUT_${key} -m set --match-set ${shareToken}IP dst -j LOG --log-prefix "${key}-OUTPUT "`)
                exec(`iptables -A OUTPUT_${key} -m set --match-set ${shareToken}IP dst -j DROP`)

                // exec(`iptables -A FORWARD_${key} -m set --match-set ${shareToken}NET dst,src -j LOG --log-prefix "${key}-FORWARD "`)
                // exec(`iptables -A FORWARD_${key} -m set --match-set ${shareToken}NET dst,src -j DROP`)

                exec(`iptables -A FORWARD_${key} -m set --match-set ${shareToken}IP dst,src -j LOG --log-prefix "${key}-FORWARD "`)
                exec(`iptables -A FORWARD_${key} -m set --match-set ${shareToken}IP dst,src -j DROP`)

                // exec(`iptables -A INPUT_${key} -m set --match-set ${shareToken}NET src -j LOG --log-prefix "${key}-INPUT "`)
                // exec(`iptables -A INPUT_${key} -m set --match-set ${shareToken}NET src -j DROP`)

                exec(`iptables -A INPUT_${key} -m set --match-set ${shareToken}IP src -j LOG --log-prefix "${key}-INPUT "`)
                exec(`iptables -A INPUT_${key} -m set --match-set ${shareToken}IP src -j DROP`)

                exec(`iptables -A INPUT -j INPUT_${key}`)
                exec(`iptables -A OUTPUT -j OUTPUT_${key}`)
                exec(`iptables -A FORWARD -j FORWARD_${key}`)
            });
        })
    } catch (e) {
        console.error(e.message)
        process.exit(-1)
    }
}

ipset.command('init', {
    desc: 'Initialize Linux ipset stream controler',
    callback: async function (options) {
        if (!options[0] || options[0].length === 0) {
            // Display error message if no share token is specified
            console.log("Please specify a share token (list) to download");
            console.log("Go to https://app.diventry.com/#/threat-intelligence to make your choice");
            console.log("You can also type: ioc-tool list")
            console.log("If you are an IOC provider, you can use your share token here");
            process.exit(-1);
        }

        await init(options)
    }
})

ipset.command('stop', {
    desc: 'Stop controller',
    callback: async function (options) {
        if (!options[0] || options[0].length === 0) {
            // Display error message if no share token is specified
            console.log("Please specify a share token (list) to download");
            console.log("Go to https://app.diventry.com/#/threat-intelligence to make your choice");
            console.log("You can also type: ioc-tool list")
            console.log("If you are an IOC provider, you can use your share token here");
            process.exit(-1);
        }

        const shareToken = options[0]
        const key = idifier(`DIVENTRY_${shareToken.toUpperCase()}`)

        exec(`iptables -D INPUT -j INPUT_${key}`)
        exec(`iptables -D OUTPUT -j OUTPUT_${key}`)
        exec(`iptables -D FORWARD -j FORWARD_${key}`)

        exec(`iptables -F INPUT_${key}`)
        exec(`iptables -F OUTPUT_${key}`)
        exec(`iptables -F FORWARD_${key}`)

        exec(`ipset flush ${shareToken}IP`)
        exec(`ipset flush ${shareToken}NET`)


    }
})

ipset.command('stream', {
    desc: 'Linux ipset stream controler',
    callback: async function (options) {
        if (!options[0] || options[0].length === 0) {
            // Display error message if no share token is specified
            console.log("Please specify a share token (list) to download");
            console.log("Go to https://app.diventry.com/#/threat-intelligence to make your choice");
            console.log("You can also type: ioc-tool list")
            console.log("If you are an IOC provider, you can use your share token here");
            process.exit(-1);
        }
        const shareToken = options[0]

        await init(options)

        async function update() {
            // load blacklist
            const ipsetCurrentFile = `${options.dataDir}/${shareToken}-current.ipset`;
            const st = fs.createWriteStream(ipsetCurrentFile);

            const ipsetExecFile = `${options.dataDir}/${shareToken}-exec.ipset`;
            const execSt = fs.createWriteStream(ipsetExecFile);

            execSt.write(`create ${shareToken}IP_next hash:ip family inet hashsize 65536 maxelem 10000000\n`)
            execSt.write(`create ${shareToken}NET_next hash:net family inet hashsize 65536 maxelem 10000000\n`)

            // touch current
            try {
                const ret = await DownloadToStream(options[0], st, options)
                if (ret) {
                    console.error(ret)
                    process.exit(-1)
                }

                st.on('finish', () => {
                    const list = fs.readFileSync(ipsetCurrentFile, "utf-8").split('\n')
                    list.forEach((el) => {
                        if (el.length === 0) return;
                        if (el[0] === '#') return;
                        const spl = el.split("/")
                        if (spl.length === 1)
                            execSt.write(`add ${shareToken}IP_next ${el}\n`);
                        else if (spl.length === 2)
                            execSt.write(`add ${shareToken}NET_next ${el}\n`);
                    })
                    st.close();
                    execSt.close(() => {
                        exec(`ipset flush ${shareToken}IP_next`)
                        exec(`ipset flush ${shareToken}NET_next`)
                        exec(`ipset restore -! < ${ipsetExecFile}`)
                        exec(`ipset swap ${shareToken}IP_next ${shareToken}IP`)
                        exec(`ipset swap ${shareToken}NET_next ${shareToken}NET`)
                        exec(`ipset destroy ${shareToken}IP_next`)
                        exec(`ipset destroy ${shareToken}NET_next`)
                    });

                    setTimeout(update, 60 * 60 * 1000)
                })
            } catch (e) {
                console.error(e.message)
                process.exit(-1)
            }
        }
        update();

    }
})

ipset.command('pm2', {
    desc: 'Build PM2 command line',
    callback: async function (options) {
        if (!options[0] || options[0].length === 0) {
            // Display error message if no share token is specified
            console.log("Please specify a share token (list) to download");
            console.log("Go to https://app.diventry.com/#/threat-intelligence to make your choice");
            console.log("You can also type: ioc-tool list")
            console.log("If you are an IOC provider, you can use your share token here");
            process.exit(-1);
        }
        const shareToken = options[0]

        const name = options.name; delete options.name;
        const bin = `${__dirname}/index.js`
        const cmd = `pm2 start -f ${bin} --name ${name} --cwd ${process.cwd()} -- ipset stream ${shareToken}`

        console.log(cmd)
    }
}).option('name', {
    abbr: 'n',
    desc: 'Name of the PM2 Process',
    default: `diventry-ioc-tool`
});;