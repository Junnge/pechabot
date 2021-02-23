const { Users } = require('../dbObjects');
module.exports = {
	name: 'showpacks',
	description: 'shows packs in your inventory.',
	aliases: ['sp'],
	category: 'User',
	async execute(message, args) {
		let user = await Users.findOne({ where: { id: message.author.id }});
		if (user === null){
			user = await Users.create({ id: message.author.id });
			console.log('New User created!');
		}
		user.getPacks().then(packs => {
			if (!packs.length) return message.channel.send(`You don't have any packs!`);
			return message.channel.send(`You currently have:\n${packs.map(p => `${p.pack.name} - ${p.amount} `).join('\n')}`);
		}).catch((e) => {console.log(e)});
	},
};