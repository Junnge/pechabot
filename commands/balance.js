const { Users } = require('../dbObjects');
module.exports = {
	name: 'balance',
	description: 'checking user balance',
	aliases: ['b'],
	async execute(message, args) {
		let user = await Users.findOne({ where: { id: message.author.id }});
		if (user === null){
			user = await Users.create({ id: message.author.id });
			console.log('New User created!');
		}
		return message.channel.send(`Your balance is ${user.balance} coins.`);
	},
};