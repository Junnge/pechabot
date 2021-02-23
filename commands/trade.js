const { Users, Cards, UserCards } = require('../dbObjects');
const { Op } = require('sequelize');
const { prefix } = require('../config.json');
module.exports = {
	name: 'trade',
	description: 'trade offer to another user',
	aliases: ['t'],
	args: true,
	usage: '<@user> <card name> <amount>&<coins> <amount>',
	cooldown: 1,
	async execute(message, args) {
		if (!message.mentions.users.first()) return message.channel.send('You have to mention a person to trade with.')
		function getRequest(m){
			let r = m.slice(1).join(' ').trim().split('&');
			r.forEach((e, i) => {
				e = e.trim().split(' ');
				let amount = e[e.length-1];
				amount = Math.abs(amount);
				amount = Math.floor(amount);
				e = e.slice(0, -1);
				let name = e.join(' ');
				r[i] = {name: name, amount: amount};
			});
			return r;
		}

		async function setTrade(u, t, status){
					u.trade = status;
					t.trade = status;
					await u.save();
					await t.save();
		}

		async function checkRequest(u, str) {
			let inputCardNames = [];
			for (let i = 0; i < str.length; i++){
				if (str[i].name === '') return {msg: `empty msg!`, result: true};  
				if (!Number.isInteger(+str[i].amount)) return {msg: `no quantity specified for  "${str[i].amount}".`, result: false};
				if (inputCardNames.indexOf(str[i].name) !== -1) return {msg: `"${str[i].name}" was listed twice!`, result: false};
				inputCardNames.push(str[i].name);
				if (str[i].name == 'coins') {
					if (str[i].amount > u.balance) return {msg: `Your have only ${u.balance} coins on your balance`, result: false};
					continue;
				}
				let card = await Cards.findOne({ where: { name: { [Op.like]: str[i].name } } });
				if (card === null) return {msg: `"${str[i].name}" does not exist.`, result: false};
				let usercard = await UserCards.findOne({ where: { card_id: card.id, user_id: u.id }, include: 'card' });
				if (usercard === null) return {msg: `you do not have a single "${str[i].name}" card.`, result: false};
				if (usercard.amount < str[i].amount) return {msg: `you only have ${usercard.amount} "${str[i].name}" card${usercard.amount > 1 ? s : ''}!`, result: false};
				str[i].name = card.name;
				str[i].id = card.id;
			}
			return {msg: ``, result: true};
		}

		let user = await Users.findOne({ where: { id: message.author.id }});
		if (user === null){
			user = await Users.create({ id: message.author.id });
			console.log('New User created!');
		}
		
		let target = await Users.findOne({ where: { id: message.mentions.users.first().id }});
		if (target === null){
			target = await Users.create({ id: message.mentions.users.first().id });
			console.log('New User created!');
		}

		await setTrade(user, target, false);
		if (user.id == target.id) return message.channel.send(`${message.author}, you cannot trade with yourself!`);
		if (user.trade) return message.channel.send(`You are already in trade, ${message.author}!`);
		if (target.trade) return message.channel.send(`${message.mentions.users.first()} is already in trade!`);
		let userOffer = getRequest(args);
		let checkResult = await checkRequest(user, userOffer);
		let targetOffer;

		const filter1 = async response => {
			let args2 = response.content.split(' ');
			if (response.author.id !== target.id || args2[0] !== prefix+'taccept') return false;
			targetOffer = getRequest(args2);
			let checkResult2 = await checkRequest(target, targetOffer);
			if (!checkResult2.result) message.channel.send(checkResult2.msg);
			return checkResult2.result;
		};
		const filter2 = response => {
			return response.author.id === message.author.id && response.content === prefix+'taccept';
		};

		if (!checkResult.result) return message.channel.send(checkResult.msg);
		await setTrade(user, target, true);
		message.channel.send(`${message.mentions.users.first()}, ${message.author} offers you ${userOffer[0].name !== '' ? userOffer.map((elem, index) => `${elem.name} ${elem.amount}` ).join(', ') : 'nothing'}.\nTo accept the trade offer send []taccept <your offer>`)
		.then( async () => {
			message.channel.awaitMessages(filter1, { max: 1, time: 120000, errors: ['time'] })
				.then(async collected => {
					message.channel.send(`${message.author}, ${message.mentions.users.first()} offers you ${targetOffer[0].name !== '' ? targetOffer.map((elem, index) => `${elem.name} ${elem.amount}` ).join(', ') : 'nothing'} in return.\nTo confirm the trade offer send []taccept`).then(() => {
						message.channel.awaitMessages(filter2, { max: 1, time: 120000, errors: ['time'] })
							.then(async collected => {
								await setTrade(user, target, false);
								for (let i = 0; i < userOffer.length; i++){
									if (userOffer[i].name == '') break;
									if (userOffer[i].name == 'coins'){
										user.balance += -userOffer[i].amount;
										await user.save();
										target.balance += +userOffer[i].amount;									
										await target.save();
									} else {
										await user.setCards(userOffer[i].id, -userOffer[i].amount);
										await target.setCards(userOffer[i].id, userOffer[i].amount);
									}
								}
								for (let i = 0; i < targetOffer.length; i++){
									if (targetOffer[i].name == '') break;
									if (targetOffer[i].name == 'coins'){
										user.balance += +targetOffer[i].amount;
										target.balance += -targetOffer[i].amount;
										await user.save();
										await target.save();
									} else {
										await user.setCards(targetOffer[i].id, targetOffer[i].amount);
										await target.setCards(targetOffer[i].id, -targetOffer[i].amount);
									}
								}
								message.channel.send(`trade confirm`);
							})
							.catch(async collected => {
								await setTrade(user, target, false);
								message.channel.send(`${message.author}, trade time is out, offer closed.`);
							});
					});
				})
				.catch(async collected => {
					await setTrade(user, target, false);
					message.channel.send(`${message.author}, trade time is out, offer closed.`);
				});
		});

	}
}