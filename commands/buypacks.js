const UserObj = (require('../classes/User.js'));
const { PacksShop } = require('../dbObjects');
const { Op } = require('sequelize');
module.exports = {
	name: 'buypacks',
	description: 'buying some packs',
	aliases: ['bp'],
	async execute(message, args) {
		if(args.length > 0 && args[0] != 'list') {
			const pack = await PacksShop.findOne({ where: { id: { [Op.like]: args[0]} } });
			if (!pack) return message.channel.send(`That pack doesn't exist. To see list of available packs use []buypacks list`);
			const amount = Number.isInteger(+args[1]) ? args[1] : 1;
			const User = new UserObj(message.author);
			user = await User.get();
			if (user === null){
				await User.create();
				user = await User.get();
			}
			if (pack.price*amount > user.balance){
				return message.channel.send(`You currently have only ${user.balance} coins, you need ${pack.price*amount} coins to make this purchase.`);
			}
			if (!pack.onSale) {
				return message.channel.send(`This pack is currently unavailable.`);
			}
			Promise.all([
				User.setPacks(pack, +amount),
				User.setMoney(user.balance - pack.price*amount)
			]).then(()=>{
				message.channel.send(`${amount} "${pack.name}" pack was bought.`);
			}).catch((e) => {console.log(e)});
		} else {
			const shop = await PacksShop.findAll({ where: { onSale: true }});
			return message.channel.send(shop.map(pack => `[${pack.id}]${pack.name}: ${pack.price}💰`).join('\n'), { code: true });
		}
	}, 
};