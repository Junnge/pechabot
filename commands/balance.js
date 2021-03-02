const { Users } = require('../dbObjects');
module.exports = {
	name: 'balance',
	description: 'checking user balance',
	aliases: ['b', 'bal'],
	category: 'User',
	async execute(message, args) {
		const [user, ucreated] = await Users.findOrCreate({where: {id: message.author.id}});
		return message.channel.send(`${message.author}, your balance is ${user.balance} coins.`);
	},
};