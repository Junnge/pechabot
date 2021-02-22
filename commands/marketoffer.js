const { Cards, UserCards, Users, Market} = require('../dbObjects');
const { Op } = require('sequelize');
module.exports = {
	name: 'marketoffer',
	description: 'creates a new offer at the market',
	aliases: ['mo', 'moffer'],
	args: true,
	usage: '<sell || buy> <cardname || id> <amount> <price>',
	async execute(message, args) {
		const [user, created] = await Users.findOrCreate({where: {id: message.author.id}});
		const price = +args[args.length-1];
		const amount = Math.abs(Math.floor(+args[args.length-2]));
		const offerType = args[0].toLowerCase();
		let card = args.slice(1, args.length-2).join(' ');
		console.log(`card: ${card}, amount: ${amount}, price: ${price}, type: ${offerType}`);
		if (offerType !== 'sell' && offerType !== 'buy' && offerType !== 's' && offerType !== 'b' ) return message.channel.send(`${message.author}, you have to specify the offer type!`);
		if (!Number.isInteger(price) || price <= 0) return message.channel.send(`${message.author}, you have to specify the amount value!`);
		if (!Number.isInteger(amount) || amount <= 0) return message.channel.send(`${message.author}, you have to specify the price value!`);
		if (Number.isInteger(+card)) {
			card = await Cards.findOne({ where: { id: { [Op.like]: card} } });
		} else {
			card = await Cards.findOne({ where: { name: { [Op.like]: card} } });
		}
		if (!card) return message.channel.send(`"${args.slice(1, args.length-2).join(' ')}" card doesn't exist.`);
		if (offerType === 'sell' || offerType === 's'){
			const usercard = await UserCards.findOne({where: {user_id: message.author.id, card_id: card.id}});
			if (!usercard) return message.channel.send(`${message.author}, you do not have a single "${card.name}" card.`);
			if (usercard.amount < amount) return message.channel.send(`${message.author}, you only have ${usercard.amount} "${card.name}" card${usercard.amount > 1 ? s : ''}.`);
			await user.setCards(card.id, -amount);
			await Market.create({
				user_id: user.id,
				card_id: card.id,
				amount: amount,
				price: price,
				offerType: 'sell'
			});
			return message.channel.send(`${message.author}, your offer to sell "${card.name}" x ${amount} at a price of ${price} has been submitted.\nYour cards have been deducted from your collection.`);

		}
		if (offerType === 'buy' || offerType === 'b'){
			if (user.balance < price*amount) return message.channel.send(`${message.author}, your balance is ${user.balance}, to create this offer your need ${amount*price} coins.`);
			user.balance -= price*amount;
			await user.save();
			await Market.create({
				user_id: user.id,
				card_id: card.id,
				amount: amount,
				price: price,
				offerType: 'buy'
			});
			return message.channel.send(`${message.author}, your offer to buy "${card.name}" x ${amount} at a price of ${price} has been submitted.\n100 coins have been deducted from your balance.`);
		}
		console.log(await Market.findAll());

	}, 
};