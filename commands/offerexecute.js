const { Cards, UserCards, Users, Market} = require('../dbObjects');
const { Op } = require('sequelize');
const { prefix } = require('../config.json');
const { MessageEmbed, createReactionCollector } = require('discord.js');
module.exports = {
	name: 'offerexecute',
	description: 'executes the specified offer on the market',
	aliases: ['oe', 'offere', 'oexecute',],
	args: true,
	usage: '<offerID> <amount>',
	category: 'market',
	async execute(message, args) {
		let [user, created] = await Users.findOrCreate({where: {id: message.author.id}});
		const offerId = Math.abs(Math.floor(+args[0]));
		let amount = Math.abs(Math.floor(+args[1]));
		if (!amount) amount = 1;
		if (!Number.isInteger(offerId)) return message.channel.send('Incorrect offer ID input!');
		if (!Number.isInteger(amount)) return message.channel.send('Incorrect amount input!');
		
		let offer = await Market.findOne({ where: { id: offerId }, include: Cards});

		const rar = offer.cards[0].rarity;
		const rBadge = rar === 'C' ? '<:C_e2:808832032822132806>' : rar === 'R' ? '<:R_e2:808832032909557801>' : rar === 'SR' ? '<:SR_e2:808832032997376021>' : '<:UR_e2:808832032632602656>';
			
		const filter = response => {
			return (response.content === prefix+'accept' || response.content === prefix+'cancel') && response.author.id === user.id;
		};

		let embed = {
			color: '#fb7f5c',
			title: `Offer ID. ${offer.id}`,
			description: ''
		};

		if (!Number.isInteger(amount)) return message.channel.send(`${message.author}, you have to specify the amount of offers you want to make.`);
		if (!offer) return message.channel.send('That offer doesn\'t exist!');

		if (offer.offerType === 'buy'){
			let userCard = await UserCards.findOne({ where: { user_id: user.id,	card_id: offer.card_id }, raw: true });
			if (!userCard) return message.channel.send(`You don\'t have any "${offer.cards[0].name}" cards.`);
			if (amount > offer.amount) return message.channel.send(`With this offer you can sell no more than ${offer.amount} cards`);
			if (amount > userCard.amount) return message.channel.send(`You don\'t have enough "${offer.cards[0].name}" cards to execute this offer`);
			
			embed.description = `${rBadge}${offer.cards[0].name} x ${amount} will be sold to for a total value of ${amount*offer.price} coins.`;
			
			message.channel.send({ embed: embed}).then(async m => {
				await m.react('✅');
				await m.react('<:cancel:813850876711272478>');
				const filter = (reaction, user) => {
					return (reaction.emoji.name === '✅' || reaction.emoji.id === '813850876711272478') && user.id === user.id;
				};
				m.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] }).then(async collected => {
					const reaction = collected.first();
					if (reaction.emoji.name === '✅') {
						offer = await Market.findOne({ where: { id: offerId }, include: Cards});
						if (!offer) {
							embed.color = '#DD2E44';
							embed.description = `This offer no longer exists.`;
							m.reactions.removeAll().catch(e => {});
							return m.edit({ embed: embed}).catch(e => {});
						}
						userCard = await UserCards.findOne({ where: { user_id: user.id,	card_id: offer.card_id }, raw: true });
						if (!userCard) {
							embed.color = '#DD2E44';
							embed.description = `You can’t execute this offer anymore because you don’t have the required cards.\nI’m wondering where they could have gone...`;
							m.reactions.removeAll().catch(e => {});
							return m.edit({ embed: embed}).catch(e => {});
						}
						if (amount > offer.amount) {
							amount = offer.amount;
						}
						if (amount > userCard.amount) {
							amount = userCard.amount;
						}
						embed.color = '#77B255';
						embed.description = `You have successfully sold ${rBadge}${offer.cards[0].name} x ${amount} for ${amount*offer.price} coins.`;
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
					} else {
						embed.color = '#DD2E44';
						embed.description = `Offer execution canceled.`;
					}					
					m.reactions.removeAll().catch(e => {});
					m.edit({ embed: embed}).catch(e => {});
				}).catch(err => {
					embed.description = `Timed out. Offer execution canceled.`;
					embed.color = '#DD2E44';			
					m.edit({ embed: embed}).catch(e => {});
					m.reactions.removeAll().catch(e => {});
				});		
			}).catch(e => console.log(e));
		}

		if (offer.offerType === 'sell') {
			if (amount > offer.amount) return message.channel.send(`With this offer you can buy no more than ${offer.amount} cards`);
			if (user.balance < amount*offer.price) return message.channel.send(`Your balance is ${user.balance}, to execute this offer your need ${amount*offer.price} coins.`);
			
			embed.description = `${rBadge}${offer.cards[0].name} x ${amount} will be bought with a total value of ${amount*offer.price} coins.`;
			message.channel.send({ embed: embed}).then(async m => {
				await m.react('✅');
				await m.react('<:cancel:813850876711272478>');
				const filter = (reaction, userR) => {
					return (reaction.emoji.name === '✅' || reaction.emoji.id === '813850876711272478') && userR.id === user.id;
				};
				m.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] }).then(async collected => {
					const reaction = collected.first();
					if (reaction.emoji.name === '✅') {
						offer = await Market.findOne({ where: { id: offerId }, include: Cards});
						if (!offer) {
							embed.color = '#DD2E44';
							embed.description = `This offer no longer exists.`;
							m.reactions.removeAll().catch(e => {});
							return m.edit({ embed: embed}).catch(e => {});
						}
						user = await Users.findOne({where: {id: message.author.id}});
						if (amount > offer.amount) {
							amount = offer.amount;
						}
						if (user.balance < amount*offer.price) {
							embed.color = '#DD2E44';
							embed.description = `You do not have enough money to execute this offer.\nI can't even imagine how you managed to spend them already.`;
							m.reactions.removeAll().catch(e => {});
							return m.edit({ embed: embed}).catch(e => {});
						}
						embed.color = '#77B255';
						embed.description = `You have successfully bought ${rBadge}${offer.cards[0].name} x ${amount} for ${amount*offer.price} coins.`;
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
					} else {
						embed.color = '#DD2E44';
						embed.description = `Offer execution canceled.`;
					}					
					m.reactions.removeAll().catch(e => {});
					m.edit({ embed: embed}).catch(e => {});
				}).catch(err => {
					embed.description = `Timed out. Offer execution canceled.`;
					embed.color = '#DD2E44';			
					m.edit({ embed: embed}).catch(e => {});
					m.reactions.removeAll().catch(e => {});
				});		
			}).catch(e => console.log(e));
		}
	}, 
};