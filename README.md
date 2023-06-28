# Diventry IOC Tool

## Introduction

The Diventry IOC Tool is a free tool that allows users to leverage certain compromise indication information consolidated by Diventry from its partners. It enables users to list, download, upload IOCs, and deploy lists on various equipment such as Linux.

## Installation

To install the Diventry IOC Tool, run the following command:

```bash
npm install -g ioc-tool
```

## Listing

To retrieve the list of public IOC lists stored at Diventry, use the following command:

```bash
ioc-tool list
```

You can use the "Share Token" to download or apply a specific list.

## Download

To download a list, you need to retrieve the Share Token of the desired list. Use the following command to download the list and display it in the stdout:

```bash
ioc-tool download <Share token>
```

If you want to save the list to a file, use the `-f` option followed by the file path:

```bash
ioc-tool download -f ./mylist.txt <Share token>
```

This command will store the list in the `mylist.txt` file.

## Applying a List to Linux IP Filtering

Before applying a list to Linux IP filtering, ensure that PM2 and the `ipset` tool are installed on your system by running the following commands:

```bash
apt install ipset
npm i -g pm2
```

After selecting your list, obtain the Share Token. Then, install PM2 using the following command:

```bash
ioc-tool ipset pm2 <Share Token>
```

This command will handle the system-specific command, and once confirmed, you can execute it. For Tor network integration, the command will be:

```
pm2 start -f [..]/ioc-tool/bin/index.js --name diventry-ioc-tool --cwd [..]/ioc-tool -- ipset stream tor
```

The Tor list will be automatically updated on the firewall. You can confirm this by checking the iptables integration using the following commands:

```bash
iptables -L -vn
ipset list
```

To stop filtering a list, use the following command:

```bash
ioc-tool ipset stop <Share Token>
```

Make sure to remove the PM2 process as well:

```bash
pm2 delete diventry-ioc-tool
```

## Transmitting IOC

Transmitting IOCs to Diventry requires a validated access to the IOC providers sections, as it is currently in closed beta. If you wish to use the IOC provider tool, please contact us at [http://www.diventry.com](http://www.diventry.com).

Before sending information, you need to format your file correctly. The file should follow the format below, where tags are optional:

```
54.26.98.67 nothing,but,4,tags
8.9.64.2 some,tags
```

Next, transmit the file using the following command:

```bash
API_KEY=yourAPIkey ioc-tool tx ip plaintext ./yourFile
```

You can also transmit a single IOC IP with tags:

```bash
API_KEY=yourAPIkey ioc-tool tx ip single 2.3.1.0 some,tags
```

## Getting Help

The program includes built-in help. To view general help, run the following command:

```bash
ioc-tool -h
```

To get help for a specific subcommand, use the following syntax:

```bash
ioc-tool info -h
```

Feel free to reach out if you have any further questions or need assistance!