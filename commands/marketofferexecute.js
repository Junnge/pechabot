const { Cards, UserCards, Users, Market} = require('../dbObjects');
const { Op } = require('sequelize');
const { prefix } = require('../config.json');
module.exports = {
	name: 'marketofferexecute',
	description: 'creates a new offer at the market',
	aliases: ['moe', 'mofferexecute', 'moffere', 'moexecute', 'marketoe', 'marketoffere'],
	args: true,
	usage: '<offerID> <amount>',
	async execute(message, args) {
		const [user, created] = await Users.findOrCreate({where: {id: message.author.id}});
		const offerId = +args[0];
		let amount = Math.abs(Math.floor(+args[1]));
		const offer = await Market.findOne({
			where: {
				id: offerId
			},
			include: Cards
		});

		const filter = response => {
			return response.content === prefix+'accept' || response.content === prefix+'cancel' && response.author.id === user.id;
		};
		if (!Number.isInteger(amount)) return message.channel.send(`${message.author}, you have to specify the amount of offers you want to make.`);
		if (user.trade) return message.channel.send(`${message.author}, at the moment you cannot do this, check if you have open offers on the market or trades with other players.`);
		
		if (offer.offerType === 'buy'){
			const userCard = await UserCards.findOne({
				where: {
					user_id: user.id,
					card_id: offer.card_id
				},
				raw: true
			});
			if (!userCard) return message.channel.send(`You don\'t have any "${offer.cards[0].name}" cards.`);
			if (amount > offer.amount) return message.channel.send(`With this offer you can sell no more than ${offer.amount} cards`);
			if (amount > userCard.amount) return message.channel.send(`You don\'t have enough "${offer.cards[0].name}" cards to execute this offer`);
			user.trade = true;
			await user.save();
			message.channel.send(`"${offer.cards[0].name}" x ${amount} will be sold for a total value of ${amount*offer.price} coins.\nTo confirm the deal, write []accept, or []cancel to exit.`)
			message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] }).then(async collected => {
				if (collected.first().content === prefix+'cancel') {
					user.trade = false;
					await user.save();
					return message.channel.send(`${message.author}, offer execution canceled.`);
				}
				await user.setCards(offer.card_id, -amount);
				user.balance += amount*offer.price;
				await user.save();
				const offerOwner = await Users.findOne({where: {id: offer.user_id}});
				await offerOwner.setCards(offer.card_id, amount);
				offer.amount -= amount;
				if (offer.amount <= 0) {
					offer.destroy();
				} else {
					offer.save();
				}
				user.trade = false;
				await user.save();
				return message.channel.send(`${message.author}, you have successfully sold "${offer.cards[0].name}" x ${amount} for ${amount*offer.price} coins.`);
			}).catch(async collected => {
				user.trade = false;
				await user.save();
				return message.channel.send(`${message.author}, time is out.`);
			});
		}
		if (offer.offerType === 'sell') {
			if (amount > offer.amount) return message.channel.send(`With this offer you can buy no more than ${offer.amount} cards`);
			if (user.balance < amount*offer.price) return message.channel.send(`Your balance is ${user.balance}, to execute this offer your need ${amount*offer.price} coins.`);
			user.trade = true;
			await user.save();
			message.channel.send(`"${offer.cards[0].name}" x ${amount} will be bought with a total value of ${amount*offer.price} coins.\nTo confirm the deal, write []accept, or []cancel to exit.`)
			message.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] }).then(async collected => {
				if (collected.first().content === prefix+'cancel') {
					user.trade = false;
					await user.save();
					return message.channel.send(`${message.author}, offer execution canceled.`);
				}
				user.balance -= amount*offer.price;
				await user.setCards(offer.card_id, amount);
				await user.save();
				const offerOwner = await Users.findOne({where: {id: offer.user_id}});
				offerOwner.balance += amount*offer.price;
				await offerOwner.save();		
				offer.amount -= amount;
				if (offer.amount <= 0) {
					offer.destroy();
				} else {
					offer.save();
				}
				user.trade = false;
				await user.save();
				return message.channel.send(`${message.author}, you have successfully bought "${offer.cards[0].name}" x ${amount} for ${amount*offer.price} coins.`);
			}).catch(async collected => {
				user.trade = false;
				await user.save();
				return message.channel.send(`${message.author}, time is out.`);
			});
		}
	}, 
};