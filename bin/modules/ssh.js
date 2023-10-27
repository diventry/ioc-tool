module.exports = {
    name: "SSH authentification failure",
    init: async (kernel) => {

        const rules = [
            { 
                regex: /Failed password for (.*) from ([a-f0-9\:\.]+) port ([0-9]+)/i, 
                ipIndex: 2, 
                tags: ['scanner', 'ssh'] 
            },
            { 
                regex: /Invalid user (.*) from (.*) port/, 
                ipIndex: 2, 
                tags: ['scanner', 'ssh', 'bruteforce'] 
            },
            { 
                regex: /Connection reset by ([a-f0-9\:\.]+) port ([0-9]+) \[preauth\]/i, 
                ipIndex: 1, 
                tags: ['scanner', 'ssh'] 
            },
            { 
                regex: /maximum authentication attempts exceeded for invalid user (.*) from ([a-f0-9\:\.]+) port ([0-9]+) ([a-z0-9]+) \[preauth\]/i, 
                ipIndex: 2, 
                tags: ['scanner', 'ssh', 'bruteforce'] 
            },
            {
                regex: /Received disconnect from ([a-f0-9\:\.]+) port ([0-9\:]+) Bye Bye \[preauth\]/i,
                ipIndex: 1,
                tags: ['scanner', 'ssh']
            },
        ]
        async function interpretor(kernel, line) {
            if (line.indexOf("sshd") > 0) {
                for (var rule of rules) {
                    const match = line.match(rule.regex)
                    if (match) {
                        if (rule.ipIndex) {
                            kernel.markIP(match[rule.ipIndex], rule.tags)
                        }
                        break
                    }
                }
            }
        }

        kernel.addFile('/var/log/auth.log', interpretor)
        kernel.addFile('/var/log/auth.log.1', interpretor, true)

        // kernel.addFile(__dirname + '/../../auth.log', interpretor)
        // kernel.addFile(__dirname + '/../../auth.log.1', interpretor, true)
    }
}
