const { Cards, UserCards, Users, Market} = require('../dbObjects');
const { Op } = require('sequelize');
module.exports = {
	name: 'offer',
	description: 'creates a new offer at the market',
	aliases: ['o'],
	args: true,
	usage: '<sell |\u200B| buy> <cardname |\u200B| id> <amount> <price>',
	category: 'Market',
	async execute(message, args) {
		const [user, created] = await Users.findOrCreate({where: {id: message.author.id}});
		const price = Math.abs(Math.floor(+args[args.length-1]));
		const amount = Math.abs(Math.floor(+args[args.length-2]));
		const offerType = args[0].toLowerCase();
		let card = args.slice(1, args.length-2).join(' ');
		if (offerType !== 'sell' && offerType !== 'buy' && offerType !== 's' && offerType !== 'b' ) return message.channel.send(`${message.author}, you have to specify the offer type!`);
		if (!Number.isInteger(price) || price <= 0) return message.channel.send(`${message.author}, you have to specify the amount value!`);
		if (!Number.isInteger(amount) || amount <= 0) return message.channel.send(`${message.author}, you have to specify the price value!`);
		if (Number.isInteger(+card)) {
			card = await Cards.findOne({ where: { id: { [Op.like]: card} } });
		} else {
			card = await Cards.findOne({ where: { name: { [Op.like]: card} } });
		}
		if (!card) return message.channel.send(`${message.author}, this card doesn't exist.`);
		if (offerType === 'sell' || offerType === 's'){
			const usercard = await UserCards.findOne({where: {user_id: message.author.id, card_id: card.id}});
			if (!usercard) return message.channel.send(`${message.author}, you do not have a single "${card.name}" card.`);
			if (usercard.amount < amount) return message.channel.send(`${message.author}, you only have ${usercard.amount} "${card.name}" card${usercard.amount > 1 ? s : ''}.`);
			await user.setCards(card.id, -amount);
			let of = await Market.create({
				user_id: user.id,
				card_id: card.id,
				amount: amount,
				price: price,
				offerType: 'sell'
			});
			return message.channel.send(`${message.author}, your offer to sell "${card.name}" x ${amount} at a price of ${price} has been submitted (offer Id. ${of.id}).\nListed cards have been deducted from your collection.`);
		}
		if (offerType === 'buy' || offerType === 'b'){
			if (user.balance < price*amount) return message.channel.send(`${message.author}, your balance is ${user.balance}, to create this offer your need ${amount*price} coins.`);
			user.balance -= price*amount;
			await user.save();
			let of = await Market.create({
				user_id: user.id,
				card_id: card.id,
				amount: amount,
				price: price,
				offerType: 'buy'
			});
			return message.channel.send(`${message.author}, your offer to buy "${card.name}" x ${amount} at a price of ${price} has been submitted (offer Id. ${of.id}).\n${amount*price} coins have been deducted from your balance.`);
		}
	}, 
};