module.exports = {
    name: "Postfix failures",
    init: async (kernel) => {

        const rules = [
            {
                regex: /disconnect from (.*)\[([a-f0-9\:\.]+)\] ehlo=1 auth=0\/1 quit=1 commands=2\/3/,
                ipIndex: 2,
                tags: ['scanner', 'fingerprint']
            },
            {
                regex: /lost connection after (.*) from (.*)\[([a-f0-9\:\.]+)\]/,
                ipIndex: 3,
                tags: ['scanner', 'fingerprint']
            },
        ]

        async function interpretor(kernel, line) {
            if (line.indexOf("postfix") > 0) {
                for (var rule of rules) {
                    const match = line.match(rule.regex)
                    if (match) {
                        if (rule.ipIndex) {
                            console.log(match[rule.ipIndex], rule.tags)
                            kernel.markIP(match[rule.ipIndex], rule.tags)
                        }
                        break
                    }
                }
            }
        }

        kernel.addFile('/var/log/mail.log', interpretor)
        kernel.addFile('/var/log/mail.log.1', interpretor, true)

        // kernel.addFile(__dirname + '/../../mail.log', interpretor)
        // kernel.addFile(__dirname + '/../../mail.log.1', interpretor, true)
    }
}
