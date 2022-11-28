// @ts-check
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const KEY_OPTIONS = {
  ABOUT: "О нас",
  LOCATION_PRICE: "Локация и цена",
  PROGRAMS: "Программы по возрастам",
  PROGRAMS_1_2: "1-2 года",
  PROGRAMS_2_3: "2-3 года",
  PROGRAMS_3_4: "3-4 года",
  REGISTRATION: "Запись",
  BACK: "Назад",
  FEEDBACK: "Отзывы",
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

const startReply = {
  reply_markup: {
    keyboard: Object.values(KEY_OPTIONS).map((val) => [{ text: val }]),
  },
};

let state = "";
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const message = msg.text;
  switch (message) {
    case "/start":
      state = STATES.START;
      break;
    case KEY_OPTIONS.ABOUT:
      state = STATES.START;
      return bot.sendMessage(chatId, "Информация о нас", startReply);
    case KEY_OPTIONS.LOCATION_PRICE:
      state = STATES.START;
      return bot.sendMessage(chatId, "Информация о лок и цене", startReply);
    case KEY_OPTIONS.FEEDBACK:
      state = STATES.START;
      return bot.sendMessage(chatId, "Feedbacks", startReply);
    case KEY_OPTIONS.CONTACTS:
      state = STATES.START;
      return bot.sendMessage(chatId, "Contacts", startReply);
    case KEY_OPTIONS.PROGRAMS:
      return bot.sendMessage(chatId, "Programs", {
        reply_markup: {
          keyboard: [
            [{ text: KEY_OPTIONS.PROGRAMS_1_2 }],
            [{ text: KEY_OPTIONS.PROGRAMS_2_3 }],
            [{ text: KEY_OPTIONS.PROGRAMS_3_4 }],
          ],
        },
      });
    case KEY_OPTIONS.PROGRAMS_1_2:
      state = STATES.START;
      return bot.sendMessage(chatId, KEY_OPTIONS.PROGRAMS_1_2, startReply)
    case KEY_OPTIONS.PROGRAMS_2_3:
      state = STATES.START;
      return bot.sendMessage(chatId, KEY_OPTIONS.PROGRAMS_2_3, startReply)
    case KEY_OPTIONS.PROGRAMS_3_4:
      state = STATES.START;
      return bot.sendMessage(chatId, KEY_OPTIONS.PROGRAMS_3_4, startReply)
    case KEY_OPTIONS.REGISTRATION:
      state = STATES.CHOOSE_AGE
      break;
    default:
      break;
  }

  switch (state) {
    case STATES.START:
      bot.sendMessage(chatId, "Здарова, выбирай че", startReply);
      break;
    case STATES.CHOOSE_AGE:
      bot.sendMessage(chatId, "Выберите Ваш возраст", startReply);
      break;
    default:
      bot.sendMessage(chatId, "Ошибка!", startReply);
      break;
  }
});
