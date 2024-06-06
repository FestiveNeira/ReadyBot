function midnightReset(bot)
{
    var date = new Date();

    var hour = date.getHours();
    var minute = date.getMinutes();
    var seconds = date.getSeconds();

    var millis = (1000 * 60 * 60 * 24) - (1000 * 60 * 60 * hour) - (1000 * 60 * minute) - (1000 * seconds);

    //wait until midnight
    setTimeout(function () {
        //remove readyrole from everyone
        bot.readyRole.members.forEach(member => {
            member.roles.remove(bot.readyRole);
        })
        //clear sooners
        bot.sooners.clear();
        updateNumReady(0, bot);

        //notify the server
        bot.readyBotChannel.send('It\'s Tomorrow! I\'ll reset the list.');

        //recur
        midnightReset();
    }, millis);
}

//parseTime function written by Ben Esposito
function parseTime(timeString) {
    let time;
    let matches;

    /* normal time format */
    if (matches = /^(\d{1,2})(?::(\d{2}))?(?:\s*(am|pm))?$/.exec(timeString)) {
        time = {
            hour: Number(matches[1]),
            minute: Number(matches[2])
        }

        /* if the time is greater than 12, use miltime instead */
        if (time.hour > 12)
            time = null;
        else {
            if (!time.minute)
                time.minute = 0;

            let meridian = matches[3];

            if (meridian) {
                if (meridian == 'pm' && time.hour != 12)
                    time.hour += 12;
            } else {
                let currentTime = new Date();

                /* if the current time is later than the time requested, add 12 hours */
                let flipMeridian = currentTime.getHours() % 12 > time.hour ||
                    (currentTime.getHours() % 12 == time.hour && currentTime.getMinutes() >= time.minute);
                let isPm = currentTime.getHours() >= 12;
                /* ^ is XOR */
                if (isPm ^ flipMeridian) {
                    time.hour += 12;
                }
            }

            time.hour %= 24;
        }
    }

    /* military time format */
    if (!time && (matches = /^(\d{2}):?(\d{2})$/.exec(timeString))) {
        time = {
            hour: Number(matches[1]),
            minute: Number(matches[2])
        }
    }

    if (!time)
        return null;

    if (time.hour >= 24)
        return null;

    if (time.minute >= 60)
        return null;

    return time;
}

function parseMultiTime(timeString)
{
    var times;
    var matches;
    if (matches = /^(\d{1,2}(?::\d{2})?(?:\s*am|pm)?),?\s*(\d{1,2}(?::\d{2})?(?:\s*am|pm)?)$/.exec(timeString)) {
        times = [matches[1], matches[2]];
    }
    if (!time && (matches = /(\d{2}:?\d{2}),?\s*(\d{2}:?\d{2})/.exec(timeString))) {
        times = [matches[1], matches[2]];
    }

    if (!times)
        return null;
        
    return times;
}

function getTimeString(time) {
    let meridian = (time.hour >= 12) ? 'pm' : 'am';
    let hourStr = time.hour % 12;

    if (hourStr == '0')
        hourStr = '12';

    return `${hourStr}:${String(time.minute).padStart(2, '0')}${meridian}`;
}

function numReady(bot)
{
    var out = bot.readyRole.members.size;
    return out;
}

function updateNumReady(num, bot)
{
    if (num === 0) {
        bot.client.user.setActivity('Nobody is ready!');
    }
    else if (num === 1) {
        bot.client.user.setActivity('1 person is ready!');
    }
    else {
        bot.client.user.setActivity(num + ' people are ready!');
    }
}

function scanRAL(bot)
{
    const fs = require('fs');

    var fileName = './data/sooners.json';

    //reads in the array of readyat times from the file
    var data = JSON.parse(fs.readFileSync(fileName));

    //converts the array into the collection in the bot
    data.readyAtList.forEach(thing => {
        var sooner =
        {
            message: thing[0],
            id: thing[1],
            hour: thing[2],
            minute: thing[3],
            type: thing[4]
        }

        bot.sooners.set(sooner.id + sooner.type, sooner);
    });

    console.log('ReadyQueue data has been read in');
}

function saveRAL(bot)
{
    const fs = require('fs');

    var wrapper =
    {
        readyAtList: []
    }

    //converts the collection of readyat times to an array of readyat times
    bot.sooners.forEach(sooner => {
        var soonerArray = [sooner.message, sooner.id, sooner.hour, sooner.minute, sooner.type];

        wrapper.readyAtList.push(soonerArray);
    });

    var fileName = './data/sooners.json';

    //saves the array to a file
    fs.writeFile(fileName, JSON.stringify(wrapper), e => {
        if (e) throw e;
    });
}

function checkRAL(bot)
{
    var time = (60 - new Date().getSeconds()) * 1000;

    var check = function (bot) {
        var date = new Date();
        var hour = date.getHours();
        var minute = date.getMinutes();

        bot.sooners.forEach(sooner => {
            if (hour === sooner.hour && minute === sooner.minute) {
                // Ping the member
                if (sooner.type = 'at') {
                    bot.readyBotChannel.send(`Are ya ready yet, <@${sooner.id}>?`);
                }
                // Written by Jasper Rutherford.
                // Unready the member
                else if (sooner.type = 'until') {
                    bot.readyBotChannel.send(`<@${sooner.id}> is no longer ready.`);
                    notready(sooner.message, 'auto', bot);
                }
                // Remove the sooner
                bot.sooners.delete(sooner.id + sooner.type);
                saveRAL(bot);
            }
        });
    }

    //start looping when there are 0 loose seconds
    setTimeout(function () {
        check(bot);

        //loop every 60 seconds
        setInterval(function () {
            check(bot);
        }, 60000);

        console.log('Timer started');
    }, time);
}

function react(params)
{
    message = params.message;
    num = params.num;

    if (num === 0) {
        message.react('\u0030\u20E3');
    }
    else if (num === 1) {
        message.react('\u0031\u20E3');
    }
    else if (num === 2) {
        message.react('\u0032\u20E3');
    }
    else if (num === 3) {
        message.react('\u0033\u20E3');
    }
    else if (num === 4) {
        message.react('\u0034\u20E3');
    }
    else if (num === 5) {
        message.react('\u0035\u20E3');
    }
    else if (num === 6) {
        message.react('\u0036\u20E3');
    }
    else if (num === 7) {
        message.react('\u0037\u20E3');
    }
    else if (num === 8) {
        message.react('\u0038\u20E3');
    }
    else if (num === 9) {
        message.react('\u0039\u20E3');
    }
    else if (num === 10) {
        message.react('\u0031\u20E3')
        message.react('\u0030\u20E3')
    }
    else {
    }
}

module.exports = {
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
};