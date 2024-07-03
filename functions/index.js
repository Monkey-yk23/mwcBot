const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");
const { Telegraf, Scenes, session } = require("telegraf");
const express = require('express');
const { config } = require("dotenv");
const bodyParser = require('body-parser');
const { text } = require("stream/consumers");

config();

const app = express();
const apiGeckoKey = process.env.APIKEY;
const bot = new Telegraf(process.env.BOTKEY, { webhook: true });
const port = 3000;

app.use(bodyParser.json());
const newMemberTracker = {};
const timeouts = {};
const buttonQuestions = {
    inline_keyboard: [
        [{ text: "I am a human", callback_data: "human" }],
        [{ text: "I am a bot", callback_data: "bot" }]
    ]
};

const miningButtons = {
    inline_keyboard: [
        [{ text: "Step by step mining tutorial", callback_data: "step1" }],
        [{ text: "Video mining tutorial", callback_data: "step2" }]
    ]
};
const miningTutorial = `Mining tutorial!
Step 1 👉 Connect to your miner dashboard by insert your miner IP address into your browser
Step 2 👉 Once you logged in,\n Select \n👉 Pool Configuration 👈 
Step 3 👉 Select GRIN 31 in the Select Coin Checkbox
Step 4 👉 Into Pool 1 insert address stratum server \n👉 stratum+tcp://stratum2.mwcpool.com:2222
Step 5 👉 Into Pool 1 worker insert your username used to register at https://mwcpool.com/
Step 6 👉 If you don’t have already registered at https://mwcpool.com/ use the same username used in Step 5👆
Step 7 👉 Congratz 🎊 \n You started mining MWC🎊`;

const miningScene = new Scenes.BaseScene('miningscene');
miningScene.enter(async (ctx) => {
    await bot.telegram.sendMessage(ctx.chat.id, "Select between theese 2 tutorials 👇", {
        parse_mode: "HTML",
        reply_markup: miningButtons,
    });

});

miningScene.action("step1", async (ctx) => {
    await bot.telegram.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);
    await bot.telegram.sendMessage(ctx.chat.id, miningTutorial);
    await ctx.scene.leave();
});

miningScene.action("step2", async (ctx) => {
    await bot.telegram.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);
    await bot.telegram.sendMessage(ctx.chat.id, "Coming Soon!");
})

const stage = new Scenes.Stage([miningScene]);
bot.use(session());
bot.use(stage.middleware());

bot.on('left_chat_member', async (ctx) => {
    await bot.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id);
});

bot.on('new_chat_members', async (ctx) => {
    const newMemberId = ctx.message.new_chat_members[0].id;
    const chatId = ctx.chat.id;
    newMemberTracker[chatId] = newMemberId;
    await bot.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id);
    const user = ctx.chat.first_name;
    await bot.telegram.restrictChatMember(chatId, newMemberId, {
        can_send_message: false,
        can_send_media_messages: false,
        until_date: Math.floor(Date.now() / 1000) + 10
    });
    const sentMessage = await bot.telegram.sendMessage(ctx.chat.id, `Hello ${user} please proof that you are human, you have only 15 seconds left`, {
        parse_mode: "HTML",
        reply_markup: buttonQuestions,
    });
    timeouts[chatId] = setTimeout(async()=>{
        try {
            await bot.telegram.deleteMessage(ctx.chat.id, sentMessage.message_id);
        } catch (error) {
            logger.log("the message is already deleted");
        }
    }, 15000);
});

bot.on('callback_query', async (ctx) => {
    const callbackQuestion = ctx.callbackQuery.data;
    const chatId = ctx.chat.id;
  
    if (newMemberTracker[ctx.chat.id] !== ctx.callbackQuery.from.id) {
        return;
    }
    delete newMemberTracker[ctx.chat.id];

    clearTimeout(timeouts[chatId]);
    delete timeouts[chatId];

    if (callbackQuestion === 'human') {
        await bot.telegram.restrictChatMember(ctx.chat.id, ctx.callbackQuery.from.id, {
            can_send_message: true,
            can_send_media_messages: true
        });
       await bot.telegram.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);

    } else if (callbackQuestion === 'bot') {
        logger.log("mining step 1 clicked");
        await bot.telegram.banChatMember(ctx.chat.id, ctx.callbackQuery.from.id, {
            until_date: 0
        });
    }
    await ctx.answerCbQuery();

});

bot.command("price", async (ctx) => {
    const price = `https://api.coingecko.com/api/v3/simple/price?ids=MimbleWimbleCoin&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&precision=2`;
    const response = await axios.get(price);
    const mwcInfo = response.data.mimblewimblecoin;
    const message = await bot.telegram.sendMessage(ctx.chat.id, `The price of MWC is ${mwcInfo.usd}$\n change ${mwcInfo.usd_24h_change.toFixed(2)}%\n the latest 24h volume are ${mwcInfo.usd_24h_vol}$`);
    console.log(mwcInfo);
    return message;
})


bot.command("mining", async (ctx) => {
    await ctx.scene.enter('miningscene');
});

bot.action("callback_data")

exports.mwcbot = onRequest(async (req, res) => {
    logger.log("Incoming message", req.body);
    bot.handleUpdate(req.body, res);
});
