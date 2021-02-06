const { Users } = require('../dbObjects');
module.exports = {
	name: 'showcards',
	description: 'shows cards in your inventory.',
	aliases: ['sc'],
	async execute(message, args) {
		let user = await Users.findOne({ where: { id: message.author.id }});
		if (user === null){
			user = await Users.create({ id: message.author.id });
			console.log('New User created!');
		}
		user.getCards().then(cards =>{
			if (!cards.length) return message.channel.send(`You don't have any packs!`);
			return message.channel.send(`Your card collection:\n${cards.map(c => `${c.card.name} - ${c.amount} `).join('\n')}`);
		}).catch((e) => {console.log(e)});
	},
};