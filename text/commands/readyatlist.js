module.exports = {
    name: 'readyatlist',
    alt: 'readysoonlist',
    secret: false,
    description: "Lists the people who will be ready soon.",
    execute(message, args, bot)
    {
        if (bot.sooners.size === 0)
        {
            message.channel.send('Nobody has indicated they will be ready soon');
        }
        else
        {
            //generates the first line of the list
            var list = 'The following ';


            if (bot.sooners.size === 1)
            {
                list = list + 'person';
            }
            else
            {
                list = list + bot.sooners.size + ' people';
            }

            list = list + ' will be ready soon:\n';

            //adds each ready person to the list
            bot.sooners.forEach(sooner =>
            {
                var hour = sooner.hour;
                var minute = sooner.minute;

                var am = true;

                if (hour > 11)
                {
                    am = false;
                }


                list += bot.guild.members.cache.get(sooner.id).displayName + ' will be ready at ';

                if (am)
                {
                    list += hour;
                }
                else
                {
                    list += (hour - 12);
                }


                if (minute < 10)
                {
                    list += ':0'
                }
                else
                {
                    list += ':'
                }

                if (am)
                {
                    list += minute + 'am';
                }
                else
                {
                    list += minute + 'pm';
                }

                list += '\n';
            })


            //sends the list
            message.channel.send(list);
        }
    }
}  