const UserObj = (require('../classes/User.js'));
const { PacksShop } = require('../dbObjects');
const { Cards } = require('../dbObjects');
const { Op } = require('sequelize');
module.exports = {
	name: 'packinfo',
	description: 'shows pack cards.',
	aliases: ['pi'],
	async execute(message, args) {
		if(args.length > 0 && args[0] != 'list') {
			const pack = await PacksShop.findOne({ where: { id: { [Op.like]: args[0]} } });
			if (!pack) return message.channel.send(`That pack doesn't exist. To see list of available packs use []buypacks list`);
			const cards = await pack.getCards();
			return message.channel.send(cards.map(card => `${card.name} [${card.rarity}]`).join('\n'));		
		} else {
			return message.channel.send(`Err:Expecting pack id in arguments.`);
		}
	}, 
};