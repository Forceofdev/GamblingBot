function coinflipUSER(message, args) {
	let user = usersPlaying.get(message.user.id)
	if(!user) {
	  const newUser =  usersPlaying.set(message.user.id, { isPlaying: true, money: 1000 })
	  user = newUser
	}
	let bigOrSmall
  
	if(args == "big") {
	  bigOrSmall = 2000
	} else if(args == "small") {
	  bigOrSmall = 500
	} else {
	  message.reply('You need to say big or small, buddy')
	  return
	}
  
	const randomValue = Math.floor(Math.random() * 2) + 1
	console.log(randomValue)
	const randomMoneyValue = Math.floor(Math.random() * bigOrSmall) + 1
	console.log(randomMoneyValue)
	if(randomValue == 1) {
	  message.reply('You won! You got: ' + randomMoneyValue)
	  let newval = user.money + randomMoneyValue
	  if(typeof user.money == "bigint") {
		const bigint = BigInt(newval)
		newval = bigint
	  }
	  user.money = user.money + newval
	  return
	} else {
	  let moneyval = randomMoneyValue
	  if(typeof user.money == "bigint") {
		const biginte = BigInt(moneyval)
		moneyval = biginte
	  }
	  message.reply('You lost, bozo. You lost: ' + randomMoneyValue)
	  console.log(typeof user.money)
	  console.log(typeof moneyval)
	  console.log('original money value: ' + user.money)
	  user.money = user.money - moneyval
	  console.log('new money value: ' + user.money)
	  return
	}
  }