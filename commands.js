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

module.exports = {
    commands: new Map(
        // USEFUL COMMANDS
        [['reset', {
            name: 'reset',
            alts: ['clear'],
            param: undefined,
            desc: 'Clears the ready queue and removes the ready role from all members',
            secret: false,
            spam: false,
            execute(message, args, bot) {
                if (message.member.hasPermission('MANAGE_ROLES')) {
                    bot.readyRole.members.forEach(member => {
                        member.roles.remove(bot.readyRole);
                    })

                    bot.sooners.clear();

                    message.channel.send('Nobody is ready!');

                    updateNumReady(0, bot);
                }
                else {
                    message.channel.send('You need the manage roles permission to use this');
                }
            }
        }],
        ['ready', {
            name: 'ready',
            alts: [],
            param: undefined,
            desc: 'Gives you the ready role',
            secret: false,
            spam: false,
            execute(message, args, bot) {
                //in case they call ready list using list as an arg
                if (args.includes('list')) {
                    commands.get('readylist').execute(message, args, bot);
                }
                else {
                    if (!message.member.roles.cache.has(bot.readyRole.id)) {
                        message.member.roles.add(bot.readyRole);

                        //if they said they are readyat, erase that (because they clearly are ready now)
                        var sooner = bot.sooners.get(message.member.id + 'at')
                        if (sooner != undefined) {
                            bot.sooners.delete(sooner.id + 'at');
                            saveRAL(bot);
                        }

                        //react if called directly
                        if (args != 'auto') {
                            message.react('👍');

                            react({
                                message: message,
                                num: numReady(bot)
                            });

                            message.react('✅');
                        }

                        updateNumReady(numReady(bot), bot);
                    }
                    else {
                        message.channel.send('We get it, you\'re ready');
                    }
                }

            }
        }],
        ['notready', {
            name: 'notready',
            alts: [],
            param: undefined,
            desc: 'Removes the ready role from you',
            secret: false,
            spam: false,
            execute(message, args, bot) {
                if (message.member.roles.cache.has(bot.readyRole.id)) {
                    message.member.roles.remove(bot.readyRole);

                    //if they said they are readyuntil, erase that (because they clearly are not ready now)
                    var sooner = bot.sooners.get(message.member.id + 'until')
                    if (sooner != undefined) {
                        bot.sooners.delete(sooner.id + 'until');
                        saveRAL(bot);
                    }

                    //react if called directly
                    if (args != 'auto') {
                        message.react('👎');

                        react({
                            message: message,
                            num: numReady(bot)
                        });

                        message.react('✅');
                    }

                    updateNumReady(numReady(bot), bot);
                }
                else {
                    message.channel.send('We get it, you aren\'t ready');
                }
            }
        }],
        ['readyat', {
            name: 'readyat',
            alts: ['readysoon'],
            param: 'time',
            desc: 'Adds you to the ready queue at the specified time (HH:MM am/pm)',
            secret: false,
            spam: false,
            execute(message, args, bot) {
                //in case they call readyat list using list as an arg
                if (args.includes('list')) {
                    commands.get('readyatlist').execute(message, args, bot);
                }
                else {
                    let arg = args.join(' ');
                    //If they don't provide an adaquate format
                    if (!arg)
                        message.channel.send('Try entering a time');
                    //if they want to cancel a previous call to readyat
                    else if (arg == 'cancel') {
                        if (bot.sooners.get(message.member.id + 'at')) {
                            time = {
                                hour: bot.sooners.get(message.member.id + 'at').hour,
                                minute: bot.sooners.get(message.member.id + 'at').minute
                            }

                            bot.sooners.delete(message.member.id + 'at');

                            message.channel.send(`${message.member.displayName} will no longer be ready at ${getTimeString(time)}`);

                            saveRAL(bot);
                        } else {
                            message.channel.send(`You weren't on the list in the first place, nerd`);
                        }
                        //readyat base case
                    } else {
                        let readyTime = parseTime(arg);

                        if (readyTime) {
                            message.channel.send(`I've got you marked down for ${getTimeString(readyTime)}`);

                            //ensure that they are not currently ready if they called directly
                            commands.get('notready').execute(message, 'auto', bot);

                            var sooner =
                            {
                                message: message,
                                id: message.member.id,
                                hour: readyTime.hour,
                                minute: readyTime.minute,
                                type: 'at'
                            }

                            message.react('✅');
                            bot.sooners.set(sooner.id + sooner.type, sooner);
                            saveRAL(bot);
                        } else
                            message.channel.send(`Nah, try again`);
                    }
                }
            }
        }],
        ['readyuntil', {
            name: 'readyuntil',
            alts: [],
            param: 'time',
            desc: 'Gives you the ready role until the specified time (HH:MM am/pm)',
            secret: false,
            spam: false,
            execute(message, args, bot) {
                //in case they call readyuntil list using list as an arg
                if (args.includes('list')) {
                    commands.get('readyuntillist').execute(message, args, bot);
                }
                else {
                    let arg = args.join(' ');

                    if (!arg)
                        message.channel.send('Try entering a time');
                    else if (arg == 'cancel') {
                        if (bot.sooners.get(message.member.id + 'until')) {
                            time = {
                                hour: bot.sooners.get(message.member.id + 'until').hour,
                                minute: bot.sooners.get(message.member.id + 'until').minute
                            }

                            bot.sooners.delete(message.member.id + 'until');

                            commands.get('notready').execute(message, 'auto', bot);

                            message.channel.send(`${message.member.displayName} is no longer ready until ${getTimeString(time)}`);

                            saveRAL(bot);
                        } else
                            message.channel.send(`You weren't not going to be ready in the first place, nerd`);
                    } else {
                        let readyTime = parseTime(arg);

                        if (readyTime) {
                            message.channel.send(`I've got you marked down until ${getTimeString(readyTime)}`);

                            //ensure that they are currently ready if they called directly
                            if (args != 'auto')
                                commands.get('ready').execute(message, 'auto', bot);

                            var sooner =
                            {
                                message: message,
                                id: message.member.id,
                                hour: readyTime.hour,
                                minute: readyTime.minute,
                                type: 'until'
                            }

                            message.react('✅');
                            bot.sooners.set(sooner.id + 'until', sooner);
                            saveRAL(bot);
                        } else
                            message.channel.send(`Nah, try again`);
                    }
                }
            }
        }],
        ['readyatuntil', {
            name: 'readyatuntil',
            alts: [],
            param: 'time, time',
            desc: 'Adds you to the ready queue at the first specified time and queues you to become unready at the second specified time (HH:MM am/pm, HH:MM am/pm)',
            secret: false,
            spam: false,
            execute(message, args, bot) {
                if (args.includes('cancel')) {
                    if (bot.sooners.get(message.member.id + 'at') && bot.sooners.get(message.member.id + 'until')) {
                        time1 = {
                            hour: bot.sooners.get(message.member.id + 'at').hour,
                            minute: bot.sooners.get(message.member.id + 'at').minute
                        }
                        time2 = {
                            hour: bot.sooners.get(message.member.id + 'until').hour,
                            minute: bot.sooners.get(message.member.id + 'until').minute
                        }

                        bot.sooners.delete(message.member.id + 'at');
                        bot.sooners.delete(message.member.id + 'until');

                        commands.get('notready').execute(message, 'auto', bot);

                        message.channel.send(`${message.member.displayName} will no longer be ready at ${getTimeString(time1)} until ${getTimeString(time2)}`);

                        saveRAL(bot);
                    } else
                        message.channel.send(`You weren't going to nor not going to be ready in the first place, nerd`);
                }
                else if (args.length == 2) {
                    var times = parseMultiTime(args.join(' '));
                    var readyTime1 = parseTime(times[0]);
                    var readyTime2 = parseTime(times[1]);

                    if (times) {
                        message.channel.send(`I've got you marked down at ${getTimeString(readyTime1)} until ${getTimeString(readyTime2)}`);

                        //ensure that they are not currently ready
                        commands.get('notready').execute(message, 'auto', bot);

                        var sooner1 =
                        {
                            message: message,
                            id: message.member.id,
                            hour: readyTime1.hour,
                            minute: readyTime1.minute,
                            type: 'at'
                        }
                        var sooner2 =
                        {
                            message: message,
                            id: message.member.id,
                            hour: readyTime2.hour,
                            minute: readyTime2.minute,
                            type: 'until'
                        }

                        message.react('✅');
                        bot.sooners.set(sooner.id + 'at', sooner1);
                        bot.sooners.set(sooner.id + 'until', sooner2);
                        saveRAL(bot);
                    }
                    else {
                        message.channel.send("The times you sent were invalid");
                    }
                }
                else {
                    message.channel.send("Try sending two times in the format (HH:MM HH:MM)");
                }
            }
        }],
        ['readylist', {
            name: 'readylist',
            alts: [],
            param: undefined,
            desc: 'Lists all currently ready members',
            secret: false,
            spam: false,
            execute(message, args, bot) {
                var numReady = numReady(bot);

                if (numReady === 0) {
                    message.channel.send('Nobody is ready');
                }
                else {
                    //generates the first line of the list
                    var list = 'The following ';


                    if (numReady === 1) {
                        list = list + 'person is';
                    }
                    else {
                        list = list + numReady + ' people are';
                    }

                    list = list + ' ready:\n';

                    //adds each ready person to the list
                    bot.readyRole.members.forEach(member => {
                        list = list + member.displayName + '\n';
                    })


                    //sends the list
                    message.channel.send(list);
                }
            }
        }],
        ['readyatlist', {
            name: 'readyatlist',
            alts: [],
            param: undefined,
            desc: 'Lists all members that will be ready later',
            secret: false,
            spam: false,
            execute(message, args, bot) {
                var num = 0;

                bot.sooners.forEach(sooner => {
                    if (sooner.type === 'at') {
                        num++;
                    }
                });

                if (num === 0) {
                    message.channel.send('Nobody has indicated they will be ready soon');
                }
                else {
                    //generates the first line of the list
                    var list = 'The following ';


                    if (num === 1) {
                        list = list + 'person';
                    }
                    else {
                        list = list + num + ' people';
                    }

                    list = list + ' will be ready soon:\n';

                    //adds each ready person to the list
                    bot.sooners.forEach(sooner => {
                        if (sooner.type === 'at') {
                            var hour = sooner.hour;
                            var minute = sooner.minute;

                            var am = true;

                            if (hour > 11) {
                                am = false;
                            }

                            list += bot.guild.members.cache.get(sooner.id + 'at').displayName + ' will be ready at ';

                            if (am) {
                                list += hour;
                            }
                            else {
                                list += (hour - 12);
                            }

                            if (minute < 10) {
                                list += ':0'
                            }
                            else {
                                list += ':'
                            }

                            if (am) {
                                list += minute + 'am';
                            }
                            else {
                                list += minute + 'pm';
                            }

                            list += '\n';
                        }
                    })


                    //sends the list
                    message.channel.send(list);
                }
            }
        }],
        ['readyuntillist', {
            name: 'readyuntillist',
            alts: [],
            param: undefined,
            desc: 'Lists all members that are ready but will become unready later',
            secret: false,
            spam: false,
            execute(message, args, bot) {
                var num = 0;

                bot.sooners.forEach(sooner => {
                    if (sooner.type === 'until') {
                        num++;
                    }
                });

                if (num === 0) {
                    message.channel.send('Nobody has indicated they will no longer be ready soon');
                }
                else {
                    //generates the first line of the list
                    var list = 'The following ';

                    if (num === 1) {
                        list = list + 'person';
                    }
                    else {
                        list = list + num + ' people';
                    }

                    list = list + ' will be ready for a while:\n';

                    //adds each ready person to the list
                    bot.sooners.forEach(sooner => {
                        if (sooner.type === 'until') {
                            var hour = sooner.hour;
                            var minute = sooner.minute;

                            var am = true;

                            if (hour > 11) {
                                am = false;
                            }

                            list += bot.guild.members.cache.get(sooner.id + 'until').displayName + ' will be ready until ';

                            if (am) {
                                list += hour;
                            }
                            else {
                                list += (hour - 12);
                            }

                            if (minute < 10) {
                                list += ':0'
                            }
                            else {
                                list += ':'
                            }

                            if (am) {
                                list += minute + 'am';
                            }
                            else {
                                list += minute + 'pm';
                            }

                            list += '\n';
                        }
                    })


                    //sends the list
                    message.channel.send(list);
                }
            }
        }],
        ['readyatclear', {
            name: 'readyatclear',
            alts: [],
            param: undefined,
            desc: 'Clears the ready queue',
            secret: false,
            spam: false,
            execute(message, args, bot) {
                if (message.member.hasPermission('MANAGE_ROLES')) {
                    bot.sooners.forEach(sooner => {
                        bot.sooners.delete(sooner.id + sooner.type);
                    });

                    saveRAL(bot);

                    message.channel.send('Nobody is ready soon!');
                }
                else {
                    message.channel.send('You need the manage roles permission to use this');
                }
            }
        }],
        ['setserver', {
            name: 'setserver',
            alts: ['setguild'],
            param: undefined,
            desc: 'Sets the ready guild to the current server',
            secret: true,
            spam: false,
            execute(message, args, bot) {
                if (message.member.hasPermission('MANAGE_GUILD')) {
                    // Read data
                    const fs = require('fs');
                    var fileName = './data/config.json';
                    var data = JSON.parse(fs.readFileSync(fileName));

                    // Update guild
                    bot.guild = message.guild;
                    data.guildID = message.guildId;

                    // Saves data
                    fs.writeFile(fileName, JSON.stringify(data), e => {
                        if (e) throw e;
                    });
                }
                else {
                    message.channel.send('You need the manage server permission to use this');
                }
            }
        }],
        ['setchannel', {
            name: 'setchannel',
            alts: ['setreadychannel'],
            param: undefined,
            desc: 'Sets the ready channel to the current channel',
            secret: true,
            spam: false,
            execute(message, args, bot) {
                if (message.member.hasPermission('MANAGE_CHANNELS')) {
                    // Read data
                    const fs = require('fs');
                    var fileName = './data/config.json';
                    var data = JSON.parse(fs.readFileSync(fileName));

                    // Update readyChannel
                    bot.readyBotChannel = message.channel;
                    data.readyBotChannelID = message.channelId;

                    // Saves data
                    fs.writeFile(fileName, JSON.stringify(data), e => {
                        if (e) throw e;
                    });
                }
                else {
                    message.channel.send('You need the manage channels permission to use this');
                }
            }
        }],
        ['setmoderatorrole', {
            name: 'setmoderatorrole',
            alts: ['setmodrole'],
            param: 'role mention',
            desc: 'Sets the moderator role to the mentioned role',
            secret: true,
            spam: false,
            execute(message, args, bot) {
                if (message.member.hasPermission('MANAGE_GUILD')) {
                    var roleID;
                    if (roleID = /<@&(\d{18})>/) {
                        // Read data
                        const fs = require('fs');
                        var fileName = './data/config.json';
                        var data = JSON.parse(fs.readFileSync(fileName));

                        // Update moderatorRole
                        bot.moderatorRole = bot.guild.roles.cache.get(roleID[1]);
                        data.moderatorRoleID = roleID[1];

                        // Saves data
                        fs.writeFile(fileName, JSON.stringify(data), e => {
                            if (e) throw e;
                        });
                    }
                    else {
                        message.channel.send('You must provide a role mention');
                    }
                }
                else {
                    message.channel.send('You need the manage server permission to use this');
                }
            }
        }],
        ['setreadyrole', {
            name: 'setreadyrole',
            alts: [],
            param: 'role mention',
            desc: 'Sets the ready role to the mentioned role',
            secret: true,
            spam: false,
            execute(message, args, bot) {
                if (message.member.hasPermission('MANAGE_ROLES')) {
                    var roleID;
                    if (roleID = /<@&(\d{18})>/) {
                        // Read data
                        const fs = require('fs');
                        var fileName = './data/config.json';
                        var data = JSON.parse(fs.readFileSync(fileName));

                        // Update readyRole
                        bot.readyRole = bot.guild.roles.cache.get(roleID[1]);
                        data.readyRoleID = roleID[1];

                        // Saves data
                        fs.writeFile(fileName, JSON.stringify(data), e => {
                            if (e) throw e;
                        });
                    }
                    else {
                        message.channel.send('You must provide a role mention');
                    }
                }
                else {
                    message.channel.send('You need the manage roles permission to use this');
                }
            }
        }],
        ['setmemberrole', {
            name: 'setmemberrole',
            alts: [],
            param: 'role mention',
            desc: 'Sets the member role to the mentioned role',
            secret: true,
            spam: false,
            execute(message, args, bot) {
                if (message.member.hasPermission('MANAGE_ROLES')) {
                    var roleID;
                    if (roleID = /<@&(\d{18})>/) {
                        // Read data
                        const fs = require('fs');
                        var fileName = './data/config.json';
                        var data = JSON.parse(fs.readFileSync(fileName));

                        // Update memberRole
                        bot.memberRole = bot.guild.roles.cache.get(roleID[1]);
                        data.memberRoleID = roleID[1];

                        // Saves data
                        fs.writeFile(fileName, JSON.stringify(data), e => {
                            if (e) throw e;
                        });
                    }
                    else {
                        message.channel.send('You must provide a role mention');
                    }
                }
                else {
                    message.channel.send('You need the manage roles permission to use this');
                }
            }
        }],
        ['setprefix', {
            name: 'setprefix',
            alts: [],
            param: 'A string of 1 or 2 characters',
            desc: 'Sets the bot prefix to the specified character(s)',
            secret: true,
            spam: false,
            execute(message, args, bot) {
                if (message.member.hasPermission('MANAGE_GUILD')) {
                    var nprefix;
                    if (nprefix = /^\s*([^\s]{1,2})\s*$/) {
                        // Read data
                        const fs = require('fs');
                        var fileName = './data/config.json';
                        var data = JSON.parse(fs.readFileSync(fileName));

                        // Update prefix
                        bot.prefix = nprefix[1];
                        data.prefix = nprefix[1];

                        // Saves data
                        fs.writeFile(fileName, JSON.stringify(data), e => {
                            if (e) throw e;
                        });
                    }
                    else {
                        message.channel.send('You must provide a string of 1 or 2 characters');
                    }
                }
                else {
                    message.channel.send('You need the manage server permission to use this');
                }
            }
        }],
        ['help', {
            name: 'help',
            alts: ['h'],
            param: undefined,
            desc: '...',
            secret: true,
            spam: false,
            execute(message, args, bot) {
                var out = '';
                commands = bot.client.commands;

                commands.forEach((command, key) => {
                    if (!command.alts.includes(key) && !command.secret) {
                        out += command.name;

                        if (command.alts.length != 0) {
                            out += ' (';
                            command.alts.forEach(alt => {
                                out += alt + ', ';
                            });
                            out = out.substring(0, out.length - 2);
                            out += ')';
                        }

                        if (command.param != undefined) {
                            out += ' <' + command.param + '>';
                        }

                        out += ': ' + command.desc + '\n';
                    }
                });

                message.channel.send(out);
            }
        }],
        // FUN COMMANDS
        ['christmas', {
            name: 'christmas',
            alts: [],
            param: undefined,
            desc: 'How long exactly until Christmas?',
            secret: true,
            spam: false,
            execute(message, args, bot) {
                var date = new Date();

                if (date.getDay === 25 && date.getMonth() === 12) {
                    message.channel.send('yes');
                }
                else {
                    var countDownDate = new Date("Dec 25, 2020 00:00:00").getTime();

                    // Get today's date and time
                    var now = new Date().getTime();

                    // Find the distance between now and the count down date
                    var distance = countDownDate - now;

                    // Time calculations for days, hours, minutes and seconds
                    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    // Display the result 
                    message.channel.send(days + "d " + hours + "h " + minutes + "m " + seconds + "s (ish)");
                }
            }
        }],
        ['e', {
            name: 'e',
            alts: [],
            param: undefined,
            desc: 'E',
            secret: true,
            spam: false,
            execute(message, args, bot) {
                message.channel.send(
                    'EEEEE\n' +
                    'E\n' +
                    'EEE\n' +
                    'E\n' +
                    'EEEEE\n');
            }
        }]
        ])
};