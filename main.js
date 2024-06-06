// Import Helpers
const {
    midnightReset,
    parseTime,
    parseMultiTime,
    getTimeString,
    numReady,
    updateNumReady,
    scanRAL,
    saveRAL,
    checkRAL,
    react
} = require('./helpers.js');

// Import commands
const {
    commands
} = require('./commands.js');

// Import specials
const {
    specials
} = require('./specials.js');

// Import generics
const {
    generics
} = require('./generics.js');

const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');

const { token, prefix, guildID, readyBotChannelID, moderatorRoleID, readyRoleID, memberRoleID } = require('./data/config.json');

//object that lets me send stuff to other files and still do references to this one. I also do my functions here apparently 
var bot = {
    prefix: prefix,
    client: client,
    guild: undefined,
    readyBotChannel: undefined,
    moderatorRole: undefined,
    readyRole: undefined,
    memberRole: undefined,
    sooners: new Discord.Collection
}

client.once('ready', () => {
    bot.guild = client.guilds.cache.get(guildID);
    bot.readyBotChannel = client.channels.cache.get(readyBotChannelID);
    bot.moderatorRole = bot.guild.roles.cache.get(moderatorRoleID);
    bot.readyRole = bot.guild.roles.cache.get(readyRoleID);
    bot.memberRole = bot.guild.roles.cache.get(memberRoleID);

    updateNumReady(numReady(bot), bot);

    midnightReset(bot);
    scanRAL(bot);

    checkRAL(bot);

    console.log('Readybot 2 confirmed');
    console.log('Readybot never dies');
});

// Imports commands and alts into one place
client.commands = commands;
// Sets up command alts
client.commands.forEach(command => {
    command.alts.forEach(alt => {
        client.commands.set(alt, command);
    });
});

client.on('message', message => {
    // Ignore messages from itself
    if (message.author.bot) return;

    // DM Channels
    if (message.channel.type === 'dm') {
    }
    // Text Channels
    else if (message.channel.type === 'text') {
        // Commands
        if (message.content.startsWith(bot.prefix)) {
            // splits the message into words after the prefix
            const args = message.content.slice(bot.prefix.length).split(/ +/);

            // The first word in the message following the prefix
            const command = args.shift().toLowerCase();

            // Check if the command is in the list
            if (client.commands.get(command) != undefined) {
                // Run the command
                client.commands.get(command).execute(message, args, bot);

                // Check if the command is in the readybot channel, and if its a spammy command
                if (message.channel.id != bot.readyBotChannel.id && client.commands.get(command).spam != false) {
                    message.channel.send('ayo, consider using the readybot channel (just an idea tho)');
                }
            }
            // If the command is not in the list
            else {
                // React accordingly
                message.channel.send('That\'s not a command, bucko');
            }
        }
        // Not commands
        else {
            generics.get('nicebot').execute(message, bot);
        }
    }
    // User specials (DM and Text Channels)
    // If they are on the list
    if (specials.get(message.author.id) != undefined) {
        // Do their special code
        specials.get(message.author.id).special(message, bot);
    }
});

client.login(token);