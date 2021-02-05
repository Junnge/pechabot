const { Users } = require('../dbObjects');
const { Op } = require('sequelize');
const { PacksShop } = require('../dbObjects');
const { UserPacks } = require('../dbObjects');
const { UserCards } = require('../dbObjects');
class User{
	constructor(user){
		this.user = user;
	}
	create(){
		return Users.create({ 
			id: this.user.id
		})
	}
	get(){
		return Users.findOne({ where: { id: this.user.id } });
	}
	setMoney(amount){
		return Users.update({balance: amount}, {where: {id: this.user.id}});
	}
	setDaily(date){
		return Users.update({dailyStamp: date}, {where: {id: this.user.id}});
	}
	setStreak(streak){
		return Users.update({dailyStreak: streak}, {where: {id: this.user.id}});
	}
	async setCards(card, amount){
		const usercard = await UserCards.findOne({ where: {user_id: this.user.id, card_id: card.id} });
		if (usercard) {
			usercard.amount += amount;
			if (usercard.amount == 0) return usercard.destroy();
			return usercard.save();
		}
		return UserCards.create({ user_id: this.user.id, card_id: card.id, amount: amount});
	}
	async getCards(){
		return await UserCards.findAll({ 
			where: { user_id: this.user.id},
			include: ['card'],
		});
	}
	async setPacks(pack, amount){
		const userpack = await UserPacks.findOne({ where: {user_id: this.user.id, pack_id: pack.id} });
		if (userpack) {
			userpack.amount += amount;
			if (userpack.amount == 0) return userpack.destroy() ;
			return userpack.save();
		}
		return UserPacks.create({ user_id: this.user.id, pack_id: pack.id, amount: amount});
	}
	async getPacks(){
		return UserPacks.findAll({
			where: { user_id: this.user.id },
			include: ['pack'],
		});
	}
}

module.exports = User;