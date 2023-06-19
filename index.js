const fs = require('fs');
const axios = require("axios")

var ApiPath = '/';

const Networks = []

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
        var response =  await axios.get(url)
        return (response.data)
    } catch (e) {
        return ({
            error: e.message
        })
    }
}

async function Post(resource, data, ttl = 0) {
    // console.log(`${GetNetwork()}${ApiPath}${resource}`, data)
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
    const net = [];
    const t = options.server.split(",");
    t.map((e) => {
        net.push(e.trim())
    })
    SetNetwork(net);
    ApiPath = options.api;

    if(process.env.API_KEY)
        axios.defaults.headers.common['Authorization'] = process.env.API_KEY
}

function RouteNetwork(rcs) {
    return (`${GetNetwork()}${ApiPath}${rcs}`)
}


class MultiQueueList {
    constructor() {
        this.receivers = {}
    }

    push(id, data) {
        if (!this.scheduler) this.scheduler = setTimeout(this.tick.bind(this), 100)
        this.receivers[id].queue.push(data);
    }
    receiver(id, cb) {
        this.receivers[id] = {
            queue: [],
            cb
        }
    }

    async tick() {
        var count = 0;

        for (var id in this.receivers) {
            const entry = this.receivers[id];
            const { queue, cb } = entry;

            const list = [];

            for (var a = 0; a < 200; a++) {
                const item = queue.shift();
                if (!item) break;
                list.push(item)
                count++;
            }
            if (list.length > 0) {
                await cb(list)
            }
        }
        if (count > 0)
            this.scheduler = setImmediate(this.tick.bind(this))
        else
            this.scheduler = setTimeout(this.tick.bind(this), 1000)
    }


    async waitEnd() {
        await new Promise((accept) => {
            function check() {
                var count = 0;
                for (var id in this.receivers) count += this.receivers[id].queue.length;
                if (count > 0) {
                    return (setTimeout(check, 1000))
                }
                accept();
            }
            setTimeout(check, 1000)
        })
    }
}

module.exports = {
    Init,
    Get,
    Post,
    ApiPath,
    GetNetwork,
    // SetNetwork,
    RouteNetwork,
    // Networks,
    // MultiQueueList
}
