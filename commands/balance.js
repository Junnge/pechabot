const UserObj = (require('../classes/User.js'));
module.exports = {
	name: 'balance',
	description: 'checking user balance',
	aliases: ['b'],
	async execute(message, args) {
		const User = new UserObj(message.mentions.users.first() || message.author);
		user = await User.get();
		if (user === null){
			await User.create();
			user = await User.get();
		}
		return message.channel.send(`${User.user.username} has ${user.balance} coins.`);
	},
};