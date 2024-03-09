import { AVAX, Arbitrum, LINK, MATIC, Optimism, Solana } from './const.js';
import { notify } from "feishu-notifier";
import { FIFOQueue } from '@moncici/queue';
import { retryDuration } from './const.js';
import { sleep } from '@moncici/sleep';
import { getPriceByCoin } from '@moncici/coingecko';
import { getPricesByCoins } from '@moncici/binance';
import { getPriceByToken } from '@moncici/dexscanner';
import { log } from '@moncici/log';
import { formatTimestamp } from '@moncici/date-time-processor';

import moment from 'moment'; // 需要先安装 moment 库

const length = 3;
const fator = 1.0015;
const btcLatestPrices = new FIFOQueue(length);
const ethLatestPrices = new FIFOQueue(length);
const arbLatestPrices = new FIFOQueue(length);
const avaxLatestPrices = new FIFOQueue(length);
const linkLatestPrices = new FIFOQueue(length);
const maticLatestPrices = new FIFOQueue(length);
const opLatestPrices = new FIFOQueue(length);
const solLatestPrices = new FIFOQueue(length);

const duration = 2000;

async function run() {
   buy(Arbitrum, arbLatestPrices);
   sleep(duration);
   buy(AVAX, avaxLatestPrices);
   sleep(duration);
   buy(LINK, linkLatestPrices);
   sleep(duration);
   buy(MATIC, maticLatestPrices);
   sleep(duration);
   buy(Optimism, opLatestPrices);
   sleep(duration);
   buy(Solana, solLatestPrices);
}


function buyRules(coin, latestPrices) {

    if(latestPrices.size() == length) {
        // const str = `${coin} prices: ${latestPrices.queue[0]}  ${latestPrices.queue[1]} ${latestPrices.queue[2]}  ${latestPrices.queue[3]}`;
        const str = `${coin} prices: ${latestPrices.queue[0]}  ${latestPrices.queue[1]} ${latestPrices.queue[2]} `;
        let timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        //rule one: BUY LONG
        if (latestPrices.queue[0] * fator < latestPrices.queue[1]
        && latestPrices.queue[1] * fator < latestPrices.queue[2]
        // && latestPrices.queue[2] * fator < latestPrices.queue[3]
        ) {
            log(`BUY LONG: ${str}`);
            notify('BUY', `${timestamp} BUY LONG: ${str}`);
        }

        timestamp = formatTimestamp(new Date());
        //rule two: BUY SHORT
        if (latestPrices.queue[0] > latestPrices.queue[1] * fator
        && latestPrices.queue[1] > latestPrices.queue[2] * fator
        // && latestPrices.queue[2] > latestPrices.queue[3] * fator
        ) {
            log(`BUY SHORT: ${str}`);
            notify('BUY', `${timestamp} BUY SHORT: ${str}`);
        }

        //rule three: 
        if (latestPrices.queue[0] > latestPrices.queue[1] * 1.08
            && latestPrices.queue[1] * 1.02 < latestPrices.queue[2]
            // && latestPrices.queue[2] < latestPrices.queue[3]
            ) {
                log(`BUY LONG SHORT: ${str}`);
                notify('BUY', `${timestamp} BUY LONG SHORT: ${str}`);
            }
    }

}

const coins = `"BTCUSDT","ETHUSDT","AVAXUSDT","ARBUSDT","LINKUSDT","MATICUSDT","OPUSDT","SOLUSDT"`;

async function buyFromBN(coins) {
    try {
        const prices = await getPricesByCoins(coins);
        for (const price of prices) {
            if (price.symbol == 'BTCUSDT') {
                btcLatestPrices.enqueue(price.price);
                log(price.symbol, btcLatestPrices);
                buyRules(price.symbol, btcLatestPrices);
                
            } else
            if (price.symbol == 'ETHUSDT') {
                ethLatestPrices.enqueue(price.price);
                log(price.symbol, ethLatestPrices);
                buyRules(price.symbol, ethLatestPrices);
            } else
            if (price.symbol == 'ARBUSDT') {
                arbLatestPrices.enqueue(price.price);
                log(price.symbol, arbLatestPrices);
                buyRules(price.symbol, arbLatestPrices);
            } else
            if (price.symbol == 'AVAXUSDT') {
                avaxLatestPrices.enqueue(price.price);
                log(price.symbol, avaxLatestPrices);
                buyRules(price.symbol, avaxLatestPrices);
            } else
            if (price.symbol == 'LINKUSDT') {
                linkLatestPrices.enqueue(price.price);
                log(price.symbol, linkLatestPrices);
                buyRules(price.symbol, linkLatestPrices);
            } else
            if (price.symbol == 'MATICUSDT') {
                maticLatestPrices.enqueue(price.price);
                log(price.symbol, maticLatestPrices);
                buyRules(price.symbol, maticLatestPrices);
            } else
            if (price.symbol == 'OPUSDT') {
                opLatestPrices.enqueue(price.price);
                log(price.symbol, opLatestPrices);
                buyRules(price.symbol, opLatestPrices);
            } else 
            if (price.symbol == 'SOLUSDT') {
                solLatestPrices.enqueue(price.price);
                log(price.symbol, solLatestPrices);
                buyRules(price.symbol, solLatestPrices);
            } 
        }
    } catch (error) {
        log('get price fail: ' + coin);
    }

    setTimeout(()=>buyFromBN(coins), retryDuration);

}

async function buy(coin, latestPrices) {
    try {
        const price = await getPriceByCoin(coin);
        latestPrices.enqueue(price);
        log(coin, latestPrices);
        buyRules(coin, latestPrices);

    } catch (error) {
        log('get price fail: ' + coin);
    }

    setTimeout(()=>buy(coin, latestPrices), retryDuration);
}

async function buyFromDex(coin, latestPrices) {
    try {
        const price = await getPriceByToken(coin);
        log(price)
        notify('BUY', price)
    } catch (error) {
        log('get price fail: ' + coin);
    }

    setTimeout(()=>buy(coin, latestPrices), retryDuration);

}

buyFromBN(coins);
// run();