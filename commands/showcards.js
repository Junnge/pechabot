const UserObj = (require('../classes/User.js'));
module.exports = {
	name: 'showcards',
	description: 'shows cards in your inventory.',
	aliases: ['sc'],
	async execute(message, args) {
		const User = new UserObj(message.mentions.users.first() || message.author);
		user = await User.get();
		if (user === null){
			await User.create();
			user = await User.get();
		}
		const cards = await User.getCards();
		if (!cards.length) return message.channel.send(`${User.user.username} has nothing!`);
		return message.channel.send(`${User.user.username} currently has:\n${cards.map(c => `${c.card.name} - ${c.amount} `).join('\n')}`);
	},
};