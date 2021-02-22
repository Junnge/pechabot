const { Cards, UserCards, Users, Market} = require('../dbObjects');
const { Op } = require('sequelize');
module.exports = {
	name: 'marketoffercancel',
	description: 'cancels your active offer at the market',
	aliases: ['moc', 'marketofferc', 'marketoc', 'mocancel', 'moffercancel', 'marketocancel'],
	args: true,
	usage: '<offer ID>',
	async execute(message, args) {
		const [user, created] = await Users.findOrCreate({where: {id: message.author.id}});
		const offerId = +args[0];
		const offer = await Market.findOne({
			where: {
				id: offerId
			},
			include: Cards
		});
		if (!offer) return message.channel.send('That offer doesn\'t exist!');
		if (offer.user_id !== message.author.id) return message.channel.send('It\'s not your offer!');
		if (offer.offerType === 'buy') {
			user.balance += offer.amount*offer.price;
			await user.save();
			message.channel.send(`Offer (ID. ${offer.id}) canceled. ${offer.amount*offer.price} coins have been returned to your balance.`);
		}
		if (offer.offerType === 'sell') {
			await user.setCards(offer.card_id, +offer.amount);
			message.channel.send(`Offer (ID. ${offer.id}) canceled. "${offer.cards[0].name}" x ${amount} have been returned to your collection.`);
		}
		await offer.destroy();
	}, 
};