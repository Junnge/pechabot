const { Users } = require('../dbObjects');
module.exports = {
	name: 'daily',
	description: 'get your daily coins!',
	aliases: ['d'],
	category: 'User',
	async execute(message, args) {
		const [user, ucreated] = await Users.findOrCreate({where: {id: message.author.id}});
		const timePassed = Math.abs(Math.floor((user.dailyStamp - Date.now()) / (1000*60*60)));
		if (timePassed > 24) {
			if (timePassed > 48) user.dailyStreak = 0;
			user.dailyStreak += 1;
			if (user.dailyStreak >= 5){
				user.balance += 400;
				user.dailyStreak = 0;
				user.dailyStamp = Date.now();
				user.save().then(()=>{
					message.channel.send(`${message.author}, 200 coins have been added.\nYou reached 5 day daily streak. 200 additional coins have been added.\nYour balance is now ${user.balance}.`);
				}).catch((e) => {console.log(e)});
			} else {
				user.balance += 200;
				user.dailyStamp = Date.now();
				user.save().then(()=>{
					message.channel.send(`${message.author}, 200 coins have been added, your balance is now ${user.balance}.\nYour daily streak is ${user.dailyStreak}. Reach streak 5 to receive bonus coins!`);
				}).catch((e) => {console.log(e)});
			}
		} else {
			message.channel.send(`${message.author}, ${24 - Math.abs(Math.floor((user.dailyStamp - Date.now()) / (1000*60*60)))}h ${60 - (Math.abs(Math.floor((user.dailyStamp - Date.now()) / (1000*60))) % 60)}m left before daily bonus.`).catch((e) => {console.log(e)});
		}
	},
};