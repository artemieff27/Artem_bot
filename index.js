// @ts-check
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { Redis } = require("@upstash/redis/with-fetch");

if (!process.env.TELEGRAM_BOT_TOKEN)
	throw new Error("TELEGRAM_BOT_TOKEN not set up");
if (!process.env.UPSTASH_REDIS_REST_URL)
	throw new Error("UPSTASH_REDIS_REST_URL not set up");
if (!process.env.UPSTASH_REDIS_REST_TOKEN)
	throw new Error("TELEGRAM_BOT_TOKEN not set up");
if (!process.env.ADMIN_KEY) throw new Error("ADMIN_KEY not set up");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const redis = Redis.fromEnv();

/**
 * @param {number} chatId
 * @returns {Promise<typeof defaultUserData | null>}
 */
async function getUser(chatId) {
	const data = await redis.get(chatId.toString());
	if (!data) return null;
	return data;
}

/**
 * @param {number} chatId
 * @param {typeof defaultUserData} data
 */
async function updateUser(chatId, data) {
	await redis.set(chatId.toString(), JSON.stringify(data));
}

async function getAllAdmins() {
	// LATER WE CAN USE LIST IN REDIS TO STORE ADMINS IF USERBASE GETS TOO BIG
	// AND GET THEM USING RANGES 0 -1
	const userKeys = await redis.keys("*");
	/** @type {typeof defaultUserData[]} */
	const users = await Promise.all(userKeys.map((key) => redis.get(key)));
	const admins = users
		.map((user, idx) => ({ ...user, chatId: userKeys[idx] }))
		.filter((user) => user.isAdmin);
	console.log({ users, admins });
	return admins;
}

const KEY_OPTIONS = {
	ABOUT: "О нас",
	LOCATION_PRICE: "Локация и цена",
	PROGRAMS: "Программы по возрастам",
	REGISTRATION: "Запись",
	BACK: "Назад",
	// FEEDBACK: "Отзывы",
	CONTACTS: "Контакты",
};

const STATES = {
	START: "START",
	// CHOOSE_PROGRAM: "CHOOSE_PROGRAM",
	CHOOSE_AGE: "CHOOSE_AGE",
	INPUT_CHILD_NAME: "INPUT_CHILD_NAME",
	INPUT_PARENT_NAME: "INPUT_PARENT_NAME",
	CHOOSE_PAYMENT_METHOD: "CHOOSE_PAYMENT_METHOD",
	CHOOSE_TIME: "CHOOSE_TIME",
	INPUT_PHONE: "INPUT_PHONE",
	FINISHED: "FINISHED",
};

const PAYMENT_METHODS = {
	METHOD_1: "METHOD_1",
	METHOD_2: "METHOD_2",
	METHOD_3: "METHOD_3",
};

const AGES = {
	"1_2A": "1-2",
	"2_3A": "2-3",
	"3_4A": "3-4",
};

const PROGRAMS = {
	PROGRAMS_1_2: AGES["1_2A"] + " года",
	PROGRAMS_2_3: AGES["2_3A"] + " года",
	PROGRAMS_3_4: AGES["3_4A"] + " года",
};

const defaultUserData = {
	state: STATES.START,
	isAdmin: false,
	CHILD_AGE: "",
	CHIILD_NAME: "",
	PARENT_NAME: "",
	PAYMENT_METHOD: "",
	CHOSEN_TIME: "",
	PHONE: "",
};

const startReply = {
	reply_markup: {
		keyboard: Object.values(KEY_OPTIONS).map((val) => [{ text: val }]),
	},
};

/** @type {typeof defaultUserData[] | undefined} */
let admins;

bot.on("message", async (msg) => {
	const chatId = msg.chat.id;
	const message = msg.text;
	let user = await getUser(chatId);
	if (!user) {
		await updateUser(chatId, defaultUserData);
		user = defaultUserData;
	}

	let state = user.state;
	switch (message) {
		case "/start":
			state = STATES.START;
			await updateUser(chatId, { ...user, state });
			break;
		case process.env.ADMIN_KEY:
			state = STATES.START;
			await updateUser(chatId, { ...user, isAdmin: true, state });
			return bot.sendMessage(
				chatId,
				"Вы стали Админом Вам будут приходить новые заявки",
				{
					// reply_markup: {
					// 	keyboard: [[{ text: "Сбросить данные" }], [{ text: "Назад" }]],
					// },
				},
			);
		case KEY_OPTIONS.ABOUT:
			state = STATES.START;
			await updateUser(chatId, { ...user, state });
			return bot.sendMessage(chatId, "Информация о нас", startReply);
		case KEY_OPTIONS.LOCATION_PRICE:
			state = STATES.START;
			await updateUser(chatId, { ...user, state });
			bot.sendLocation(chatId, 36.6301145, 29.1501351);
			return bot.sendMessage(chatId, "Информация о цене", startReply);
		case KEY_OPTIONS.FEEDBACK:
			state = STATES.START;
			await updateUser(chatId, { ...user, state });
			return bot.sendMessage(chatId, "Feedbacks", startReply);
		case KEY_OPTIONS.CONTACTS:
			state = STATES.START;
			await updateUser(chatId, { ...user, state });
			return bot.sendMessage(chatId, "Contacts", startReply);
		case KEY_OPTIONS.PROGRAMS:
			return bot.sendMessage(chatId, "Programs", {
				reply_markup: {
					keyboard: [
						[{ text: PROGRAMS.PROGRAMS_1_2 }],
						[{ text: PROGRAMS.PROGRAMS_2_3 }],
						[{ text: PROGRAMS.PROGRAMS_3_4 }],
						[{ text: KEY_OPTIONS.BACK }],
					],
				},
			});
		case PROGRAMS.PROGRAMS_1_2:
			state = STATES.START;
			await updateUser(chatId, { ...user, state });
			return bot.sendMessage(chatId, PROGRAMS.PROGRAMS_1_2, startReply);
		case PROGRAMS.PROGRAMS_2_3:
			state = STATES.START;
			await updateUser(chatId, { ...user, state });
			return bot.sendMessage(chatId, PROGRAMS.PROGRAMS_2_3, startReply);
		case PROGRAMS.PROGRAMS_3_4:
			state = STATES.START;
			await updateUser(chatId, { ...user, state });
			return bot.sendMessage(chatId, PROGRAMS.PROGRAMS_3_4, startReply);
		case KEY_OPTIONS.REGISTRATION:
			state = STATES.CHOOSE_AGE;
			await updateUser(chatId, { ...user, state });
			break;
		case KEY_OPTIONS.BACK:
			if (state === STATES.CHOOSE_AGE) state = STATES.START;
			if (state === STATES.INPUT_CHILD_NAME) state = STATES.CHOOSE_AGE;
			if (state === STATES.INPUT_PARENT_NAME) state = STATES.INPUT_CHILD_NAME;
			if (state === STATES.CHOOSE_PAYMENT_METHOD)
				state = STATES.INPUT_PARENT_NAME;
			if (state === STATES.CHOOSE_TIME) state = STATES.CHOOSE_PAYMENT_METHOD;
			if (state === STATES.INPUT_PHONE) state = STATES.CHOOSE_TIME;
			if (state === STATES.FINISHED) state = STATES.INPUT_PHONE;
			await updateUser(chatId, { ...user, state });
			break;
		default:
			if (!message) break;
			if (state === STATES.CHOOSE_AGE) {
				if (!Object.values(AGES).includes(message)) {
					return bot.sendMessage(
						chatId,
						"Пожалуйста, выберите один из вожможных вариантов",
						{
							reply_markup: {
								keyboard: [
									[
										{ text: AGES["1_2A"] },
										{ text: AGES["2_3A"] },
										{ text: AGES["3_4A"] },
										{ text: KEY_OPTIONS.BACK },
									],
								],
							},
						},
					);
				}
				state = STATES.INPUT_CHILD_NAME;
				await updateUser(chatId, { ...user, state, CHILD_AGE: message });
				break;
			}
			if (state === STATES.INPUT_CHILD_NAME) {
				state = STATES.INPUT_PARENT_NAME;
				await updateUser(chatId, { ...user, state, CHIILD_NAME: message });
				break;
			}
			if (state === STATES.INPUT_PARENT_NAME) {
				state = STATES.CHOOSE_TIME;
				await updateUser(chatId, { ...user, state, PARENT_NAME: message });
				break;
			}
			// if (state === STATES.CHOOSE_PAYMENT_METHOD) {
			// 	if (!Object.values(PAYMENT_METHODS).includes(message)) {
			// 		return bot.sendMessage(
			// 			chatId,
			// 			"Пожалуйста, выберите один из вожможных вариантов",
			// 			{
			// 				reply_markup: {
			// 					keyboard: [
			// 						[
			// 							{ text: PAYMENT_METHODS.METHOD_1 },
			// 							{ text: PAYMENT_METHODS.METHOD_2 },
			// 							{ text: PAYMENT_METHODS.METHOD_3 },
			// 							{ text: KEY_OPTIONS.BACK },
			// 						],
			// 					],
			// 				},
			// 			},
			// 		);
			// 	}
			// 	state = STATES.CHOOSE_TIME;
			// 	await updateUser(chatId, { ...user, state, PAYMENT_METHOD: message });
			// 	break;
			// }
			if (state === STATES.CHOOSE_TIME) {
				state = STATES.INPUT_PHONE;
				await updateUser(chatId, { ...user, state, CHOSEN_TIME: message });
				break;
			}
			if (state === STATES.INPUT_PHONE) {
				state = STATES.FINISHED;
				await updateUser(chatId, { ...user, state, PHONE: message });
				break;
			}
			break;
	}

	switch (state) {
		case STATES.START:
			bot.sendMessage(chatId, "Привет! Меня зовут Альбина, я занимаюсь ранним развитием детей в нашем уютном клубе «Маруся».🧸 Занятия в нашем клубе направлены на разные возрастные группы, они проходят в игровой форме и очень нравятся деткам.", startReply);
			break;
		case STATES.CHOOSE_AGE:
			bot.sendMessage(chatId, "Выберите Ваш возраст", {
				reply_markup: {
					keyboard: [
						[{ text: AGES["1_2A"] }],
						[{ text: AGES["2_3A"] }],
						[{ text: AGES["3_4A"] }],
						[{ text: KEY_OPTIONS.BACK }],
					],
				},
			});
			break;
		case STATES.INPUT_CHILD_NAME:
			bot.sendMessage(chatId, "Введите имя ребенка");
			break;
		case STATES.INPUT_PARENT_NAME:
			bot.sendMessage(chatId, "Введите имя родителя");
			break;
		// case STATES.CHOOSE_PAYMENT_METHOD:
		// 	bot.sendMessage(chatId, "Выберите способ оплаты", {
		// 		reply_markup: {
		// 			keyboard: [
		// 				[{ text: PAYMENT_METHODS.METHOD_1 }],
		// 				[{ text: PAYMENT_METHODS.METHOD_2 }],
		// 				[{ text: PAYMENT_METHODS.METHOD_3 }],
		// 				[{ text: KEY_OPTIONS.BACK }],
		// 			],
		// 		},
		// 	});
		// 	break;
		case STATES.CHOOSE_TIME:
			bot.sendMessage(chatId, "Выберите время", startReply);
			break;
		case STATES.INPUT_PHONE:
			bot.sendMessage(chatId, "Ваш номер телефона");
			break;
		case STATES.FINISHED:
			notifyAdmins(user);
			bot.sendMessage(chatId, "Поздравляю!", startReply);
			break;
		default:
			bot.sendMessage(chatId, "Ошибка!", startReply);
			break;
	}
});

async function notifyAdminsThatBotHasStarted() {
	const admins = await getAllAdmins();
	const message = `
  Бот запущен!
  `;
	console.log(message);
	admins.forEach((admin) => {
		bot.sendMessage(admin.chatId, message);
	});
}

/**
 * @param {typeof defaultUserData} user
 */
 async function notifyAdmins(user) {
	if (!admins) {
		admins = await getAllAdmins();
	}
	const message = `
    Новая заявка
    Имя ребенка: ${user.CHIILD_NAME}
    Возраст: ${user.CHILD_AGE}
    Имя родителя: ${user.PARENT_NAME}
    Время: ${user.CHOSEN_TIME}
    Телефон: ${user.PHONE}
  `;
	admins.forEach((admin) => {
		bot.sendMessage(admin.chatId, message);
		bot.sendContact(admin.chatId, user.PHONE, user.PARENT_NAME);
	});
}

notifyAdminsThatBotHasStarted().catch(console.error);
