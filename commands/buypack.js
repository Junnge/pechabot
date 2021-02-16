const { PacksShop } = require('../dbObjects');
const { Users } = require('../dbObjects');
const { Op } = require('sequelize');
module.exports = {
	name: 'buypack',
	description: 'buying some packs',
	aliases: ['bp'],
	usage: '<pack\'s ID or name> <amount>',
	async execute(message, args) {
		if(args.length > 0 && args[0] != 'list') {
			let amount = 1;
			let packname = '';
			let pack;
			if (args.length > 1) {
				const amount = Number.isInteger(+args[args.length - 1]) && args[args.length - 1] > 0 ? +args[args.length - 1] : 1;
				args = args.slice(0, -1);
			}	
			for (let i = 0; i < args.length; i++){
				packname += args[i]+' ';
			}
			packname = packname.slice(0, -1);
			if (Number.isInteger(+packname)) {
				pack = await PacksShop.findOne({ where: { id: { [Op.like]: packname} } });
			} else {
				pack = await PacksShop.findOne({ where: { name: { [Op.like]: packname} } });
			}
			if (!pack) return message.channel.send(`That pack doesn't exist. To see list of available packs use []buypacks list`);
			
			let user = await Users.findOne({ where: { id: message.author.id }});
			if (user === null){
				user = await Users.create({ id: message.author.id });
				console.log('New User created!');
			}
			if (pack.price*amount > user.balance){
				return message.channel.send(`You currently have only ${user.balance} coins, you need ${pack.price*amount} coins to make this purchase.`);
			}
			if (!pack.onSale) {
				return message.channel.send(`This pack is currently unavailable.`);
			}
			user.balance -= amount*pack.price;
			Promise.all([
				user.setPacks(pack, +amount),
				user.save()
			]).then(()=>{
				message.channel.send(`${amount} "${pack.name}" ${amount == 1 ? 'pack was' : 'packs were'} bought.`);
			}).catch((e) => {console.log(e)});
		} else {
			const shop = await PacksShop.findAll({ where: { onSale: true }});
			return message.channel.send(shop.map(pack => `[${pack.id}]${pack.name}: ${pack.price}💰`).join('\n'), { code: true });
		}
	}, 
};