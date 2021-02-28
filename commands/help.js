const { prefix } = require('../config.json');

module.exports = {
	name: 'help',
	description: 'List all of my commands or info about a specific command.',
	aliases: ['commands'],
	usage: '[command name]',
	cooldown: 5,
	category: 'General',
	execute(message, args) {
		const data = [];
		
		const { commands } = message.client;
		
		
		if (!args.length) {
			let ar = {};
			commands.map(command => {
				let cat = command.category ? command.category : 'General';
				if (ar[cat]){
					ar[cat].push(command.name)
				} else {
					ar[cat] = [command.name];
				}				
			});
			let embed = {
				color : '#fb7f5c',
				title: 'Here\'s a list of all my commands:',
				fields: [],
				footer: {
					text: `You can send ${prefix}help [command name] to get info on a specific command!`
				} 
			}
			Object.keys(ar).map(c => {
				embed.fields.push({
					name: c,
					value: ar[c].map(n => `${prefix}${n}`).join("\n"),
					inline: true
				})
			})

			return message.channel.send({embed: embed});
		}

		const name = args[0].toLowerCase();
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		if (!command) {
			return message.reply('that\'s not a valid command!');
		}

		data.push(`**Name:** ${command.name}`);

		if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
		//data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);
		if (command.guide) data.push(`**Guide:** ${command.guide}`);
		message.channel.send(data, { split: true });
	},
};