const UserObj = (require('../classes/User.js'));
module.exports = {
	name: 'daily',
	description: 'get your daily dose of coins!',
	aliases: ['d'],
	async execute(message, args) {
		const User = new UserObj(message.author);
		user = await User.get();
		if (user === null){
			await User.create();
			user = await User.get();
		}
		const timePassed = Math.abs(Math.floor((user.dailyStamp - Date.now()) / (1000*60*60)));
		if (timePassed > 24) {
			if (timePassed > 48) user.dailyStreak = 0;
			user.dailyStreak += 1;
			if (user.dailyStreak >= 5){
				user.balance += 200;
				user.dailyStreak = 0;
				user.dailyStamp = Date.now();
				Promise.all([
					User.setStreak(user.dailyStreak),
					User.setDaily(user.dailyStamp),
					User.setMoney(user.balance)
				]).then(()=>{
					message.channel.send(`100 coins have been added.\nYou reached 5 day daily streak. 100 additional coins have been added.\nYour balance is now ${user.balance}.`);
				}).catch((e) => {console.log(e)});
			} else {
				user.balance += 100;
				user.dailyStamp = Date.now();
				Promise.all([
					User.setStreak(user.dailyStreak),
					User.setDaily(user.dailyStamp),
					User.setMoney(user.balance)
				]).then(()=>{
					message.channel.send(`100 coins have been added, your balance is now ${user.balance}.\nYour daily streak is ${user.dailyStreak}. Reach streak 5 to receive bonus coins!`);
				}).catch((e) => {console.log(e)});
			}
		} else {
			message.channel.send(`${24 - timePassed} hours left before daily bonus.`);
		}
	},
};