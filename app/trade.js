const fs = require('fs');
const TradeOfferManager = require('steam-tradeoffer-manager');
const backpack = require('./backpacktf');
const AutomaticOffer = require('./automatic-offer');

const POLLDATA_FILENAME = 'polldata.json';

let manager, log, Config;

exports.register = (Automatic) => {
    log = Automatic.log;
    manager = Automatic.manager;
    Config = Automatic.config;

    if (fs.existsSync(POLLDATA_FILENAME)) {
        try {
            manager.pollData = JSON.parse(fs.readFileSync(POLLDATA_FILENAME));
        } catch (e) {
            log.verbose("polldata.json is corrupt: ", e);
        }
    }

    manager.on('pollData', savePollData);
    manager.on('newOffer', handleOffer);
    manager.on('receivedOfferChanged', offerStateChanged);
};

function savePollData(pollData) {
    fs.writeFile(POLLDATA_FILENAME, JSON.stringify(pollData), (err) => {
        if (err) log.warn("Error writing poll data: " + err);
    });
}

function handleOffer(tradeoffer) {
    const offer = new AutomaticOffer(tradeoffer);
    if (offer.isGlitched()) {
        offer.log("warn", `received from ${offer.partner64()} is glitched (Steam might be down).`);
        return;
    }

    offer.log("info", `received from ${offer.partner64()}`);

    if (offer.fromOwner()) {
        offer.log("info", `is from owner, accepting`);
        offer.accept().then((status) => {
            offer.log("trade", `successfully accepted${status === 'pending' ? "; confirmation required" : ""}`);
            log.debug("Owner offer: not sending confirmation to backpack.tf");
        }).catch((msg) => {
            offer.log("warn", `(owner offer) couldn't be accepted: ${msg}`);
        });
        return;
    }
    
    if (offer.isOneSided()) {
        if (offer.isGiftOffer() && Config.get("acceptGifts")) {
            offer.log("info", `is a gift offer asking for nothing in return, will accept`);
            offer.accept().then((status) => {
                offer.log("trade", `(gift offer) successfully accepted${status === 'pending' ? "; confirmation required" : ""}`);
                log.debug("Gift offer: not sending confirmation to backpack.tf");
            }).catch((msg) => {
                offer.log("warn", `(gift offer) couldn't be accepted: ${msg}`);
            });
        } else {
            offer.log("info", "is a gift offer, skipping");
        }
        return;
    }
    
    if (offer.games.length !== 1 || offer.games[0] !== 440) {
        offer.log("info", `contains non-TF2 items, skipping`);
        return;
    }

    offer.log("debug", `handling buy orders`);
    let ok = backpack.handleBuyOrdersFor(offer);
    if (ok === false) return;
    offer.log("debug", `handling sell orders`);
    backpack.handleSellOrdersFor(offer).then((ok) => {
        if (ok) {
            offer.log("debug", `finalizing offer`);
            backpack.finalizeOffer(offer);
        }
    });
}

function offerStateChanged(tradeoffer, oldState) {
    const offer = new AutomaticOffer(tradeoffer, {countCurrency: false});
    offer.log("verbose", `state changed: ${TradeOfferManager.ETradeOfferState[oldState]} -> ${offer.stateName()}`);

    if (offer.state() === TradeOfferManager.ETradeOfferState.InvalidItems) {
        offer.log("info", "is now invalid, declining");
        offer.decline().then(() => offer.log("debug", "declined")).catch(() => offer.log("info", "(Offer was marked invalid after being accepted)"));
    }
}

