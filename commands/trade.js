const { Users, Cards, UserCards } = require('../dbObjects');
const { Op } = require('sequelize');
const { prefix } = require('../config.json');
module.exports = {
	name: 'trade',
	description: 'trade offer to another user',
	aliases: ['t'],
	args: true,
	usage: '<@user> <card name> <amount>&<coins> <amount>',
	cooldown: 10,
	category: 'General',
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

		let [user, ucreated] = await Users.findOrCreate({where: {id: message.author.id}});
		let [target, tcreated] = await Users.findOrCreate({ where: { id: message.mentions.users.first().id }});		
		
		if (user.id == target.id) return message.channel.send(`${message.author}, you cannot trade with yourself!`);
		let userOffer = getRequest(args);
		let checkResult = await checkRequest(user, userOffer);
		let targetOffer;

		const filter1 = async response => {
			let args2 = response.content.split(' ');
			if (response.author.id !== target.id || (args2[0] !== prefix+'accept' && args2[0] !== prefix+'cancel' && args2[0] !== prefix+'deny')) return false;
			if (args2[0] === prefix+'cancel' || args2[0] === prefix+'deny') return true;
			targetOffer = getRequest(args2);
			let checkResult2 = await checkRequest(target, targetOffer);
			if (!checkResult2.result) message.channel.send(`${response.author}, ${checkResult2.msg}`);
			return checkResult2.result;
		};

		const filter2 = response => {
			return response.author.id === message.author.id && response.content === prefix+'accept';
		};

		if (!checkResult.result) return message.channel.send(`${message.author}, ${checkResult.msg}`);
		message.channel.send(`${message.mentions.users.first()}, ${message.author} offers you ${userOffer[0].name !== '' ? userOffer.map((elem, index) => `${elem.name} ${elem.amount}` ).join(', ') : 'nothing'}.\nTo accept the trade offer send []accept <your offer>, to end trade send []cancel.`)
		.then( async () => {
			message.channel.awaitMessages(filter1, { max: 1, time: 120000, errors: ['time'] })
				.then(async collected => {
					console.log(targetOffer);
					message.channel.send(`${message.author}, ${message.mentions.users.first()} offers you ${targetOffer[0].name !== '' ? targetOffer.map((elem, index) => `${elem.name} ${elem.amount}` ).join(', ') : 'nothing'} in return.\nTo confirm the trade offer send []accept, to end trade send []cancel.`).then(() => {
						message.channel.awaitMessages(filter2, { max: 1, time: 120000, errors: ['time'] })
							.then(async collected => {
								let c13 = await checkRequest(user, userOffer);
								let c14 = await checkRequest(target, targetOffer);
								if (!c13.result || !c14.result) return message.channel.send('err, trade closed.');
														
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
								console.log(collected);
								message.channel.send(`${message.author}, trade time is out, offer closed.`);
							});
					});
				})
				.catch(async collected => {
					console.log(collected);
					message.channel.send(`${message.author}, trade time is out, offer closed.`);
				});
		});

	}
}