const UserObj = (require('../classes/User.js'));
module.exports = {
	name: 'showpacks',
	description: 'shows packs in your inventory.',
	aliases: ['sp'],
	async execute(message, args) {
		const User = new UserObj(message.mentions.users.first() || message.author);
		user = await User.get();
		if (user === null){
			await User.create();
			user = await User.get();
		}
		const packs = await User.getPacks();
		if (!packs.length) return message.channel.send(`${User.user.username} has nothing!`);
		return message.channel.send(`${User.user.username} currently has:\n${packs.map(t => `${t.pack.name} - ${t.amount} `).join('\n')}`);
	},
};