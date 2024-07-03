MWC Bot
Overview
MWC Bot is a Telegram bot designed to help users with MimbleWimbleCoin (MWC) related activities. This bot includes functionalities for mining tutorials, human verification for new members, and fetching MWC prices from CoinGecko.

Features
Human Verification: When new members join the chat, they must prove they are human within 15 seconds by clicking a button. If they fail to do so, they are removed.
Mining Tutorials: Users can request mining tutorials through a command and receive step-by-step instructions or a video tutorial (coming soon).
MWC Price Check: Users can check the current price of MWC using a command which fetches data from CoinGecko.
Prerequisites
Node.js
Firebase Functions
Telegram Bot API key
CoinGecko API key

Environment variables set up in a .env file:
BOTKEY=your_telegram_bot_key
APIKEY=your_coingecko_api_key

Clone this repository
git clone https://github.com/yourusername/mwcbot.git

Install dependencies
npm install

Create a '.env' file in the root directory and add your API keys
BOTKEY=your_telegram_bot_key
APIKEY=your_coingecko_api_key

Deploy to firebase functions
firebase deploy --only functions

USAGE
Start the bot: The bot will automatically start handling updates when deployed.
Commands:
/price: Fetches and displays the current price of MWC along with market cap, 24-hour volume, and 24-hour change.
/mining: Provides a mining tutorial with options for step-by-step instructions or a video tutorial.


Exports
Firebase Function Export: Exports the mwcbot function which handles incoming requests to the bot.

License
This project is licensed under the MIT License - see the LICENSE.md file for details.
