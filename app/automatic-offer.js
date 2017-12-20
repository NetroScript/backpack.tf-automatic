const TradeOfferManager = require('steam-tradeoffer-manager');
const Confirmations = require('./confirmations');
const Utils = require('./utils');
let Automatic;

//const KillstreakNames = ["", "Killstreak", "Specialized Killstreak", "Professional Killstreak"];

class AutomaticOffer {
    constructor(offer, opts={}) {
        this.tradeoffer = offer;
        this.tid = offer.id;

        // Original offer
        this.exchange = {ours: offer.itemsToGive, theirs: offer.itemsToReceive};
        // Items to be handled
        this.items = {ours: [], theirs: []};
        // Offer values
        this.currencies = {ours: {keys: 0, metal: 0}, theirs: {keys: 0, metal: 0}};
        this.bought = [];

        this.games = [];
        if (opts.countCurrency !== false) {
            this.recountCurrency();
        }
    }

    static getOfferError(err) {
        let msg = err.cause || err.message;
        if (err.eresult) {
            msg = TradeOfferManager.EResult[err.eresult];
        }
        return msg;
    }

    // don't use app_data as sometimes it is missing
    static isKey(item) {
        return (item.market_hash_name || item.market_name) === "Mann Co." +
            " Supply Crate Key" && this.isUnique(item);
    }

    static isUnique(item) {
        return item.name_color === "7D6D00";
    }

    static getMetalValue(item) {
        if (AutomaticOffer.isCraftWeapon(item)) {
            return 1/18;
        }

        switch ((item.market_hash_name || item.market_name)) {
            case "Scrap Metal":
                return 1/9;
            case "Reclaimed Metal":
                return 1/3;
            case "Refined Metal":
                return 1;
        }

        return 0;
    }

    static isMetal(item) {
        const name = item.market_hash_name || item.market_name;
        return (name === "Scrap Metal" || name === "Reclaimed Metal" || name === "Refined Metal") && this.isUnique(item);
    }

    static isCraftWeapon(item) {
        // craft weapons aren't marketable
        if (item.marketable) {
            return false;
        }

        const isUnique = this.isUnique(item);
        if (!isUnique) {
            return false;
        }

        const type = item.getTag('Type');
        if (!type) {
            return false;
        }

        if (typeof type.name !== 'string') {
            return false;
        }

        if (item.market_hash_name.match(/(Class|Slot) Token/)) {
            return false;
        }

        if (!AutomaticOffer.itemIsUncraftable(item)) {
            return false;
        }

        return ['primary weapon', 'secondary weapon', 'melee weapon', 'primary pda', 'secondary pda'].indexOf(type.name.toLowerCase()) != -1;
    }

    // an item class wrapper for this stuff would be nice but this is simpler
    // todo?
    static itemHasDescription(item, desc) {
        const descriptions = item.descriptions;
        if (!descriptions) return false;

        return descriptions.some((d) => {
            return d.value === desc;
        });
    }
    
    static itemHasDescriptionStartingWith(item, desc) {
        const descriptions = item.descriptions;
        if (!descriptions) return false;

        return descriptions.some((d) => {
            return d.value.slice(0, desc.length) === desc;
        });
    }

    static itemKillstreakTier(item) {
        if (AutomaticOffer.itemHasDescriptionStartingWith(item, "Killstreaker:")) {
            return 3;
        } else if (AutomaticOffer.itemHasDescriptionStartingWith(item, "Sheen:")) {
            return 2;
        } else if (AutomaticOffer.itemHasDescription(item, "Killstreaks Active")) {
            return 1;
        }

        return 0;
    }

    static itemIsUncraftable(item) {
        return AutomaticOffer.itemHasDescription(item, "( Not Usable in Crafting )");
    }

    static itemParticleEffect(item) {
        const desc = item.descriptions;
        let particle = "";

        for (let i = 0; i < desc.length; i += 1) {
            let value = desc[i].value;
            if (value[0] === "\u2605") { // Unusual star in inv
                particle = value.substr(18); // Remove "★ Unusual Effect: "
                break;
            }
        }

        return particle;
    }

    static toBackpackName(item) {
        let name = item.market_hash_name;
        let particle = AutomaticOffer.itemParticleEffect(item);

        if (particle) {
            name = particle + " " + name.substr(name.indexOf(" ") + 1); // Remove "Unusual"
        }

        if (AutomaticOffer.itemIsUncraftable(item)) {
            name = "Non-Craftable " + name;
        }

        return name;
    }

    recountCurrency() {
        this._countCurrencies(this.exchange.ours, this.currencies.ours, false);
        this._countCurrencies(this.exchange.theirs, this.currencies.theirs, true);
    }

    summarizeItems(items) {
        let names = {};
        
        items.forEach((item) => {
            let name = AutomaticOffer.toBackpackName(item);
            names[name] = (names[name] || 0) + 1;
        });

        let formattedNames = [];
        for (let name in names) {
            formattedNames.push(name + (names[name] > 1 ? " x" + names[name] : ""));
        }

        return formattedNames.join(', ');
    }
    summarizeCurrency(currencies) {
        let message = "";

        for (let currency in currencies) {
            let amount = currencies[currency];

            if (amount !== 0) {
                let formatted = amount.toFixed(3);
                formatted = +formatted.substr(0, formatted.length - 1); // essentially toFixed(2) without rounding; + removes trailing zeroes

                message += `${formatted} ${currency === "metal" ? "ref" : (formatted === 1 ? "key" : "keys")} `;
            }
        }

        return message;
    }
    summary(opts={}) {
        let message = `Asked: ${this.summarizeCurrency(this.currencies.ours)} (${this.summarizeItems(this.exchange.ours)})
Offered: ${this.summarizeCurrency(this.currencies.theirs)} (${this.summarizeItems(this.exchange.theirs)})`;

        if (opts.includeBuyOrders && this.bought.length) {
            message += `\r\nBought items (${this.bought.length}): ${this.summarizeItems(this.bought.map(index => this.exchange.theirs[index]))}`;
        }

        return message;
    }

    _countCurrencies(items, cur, includeWeapons) {
        for (let i = 0; i < items.length; i += 1) {
            let item = items[i];

            if (this.games.indexOf(item.appid) === -1) {
                this.games.push(item.appid);
            }

            if (AutomaticOffer.isKey(item)) {
                cur.keys += 1;
            } else {
                const metalValue = includeWeapons ? AutomaticOffer.getMetalValue(item) : (AutomaticOffer.isMetal(item) ? AutomaticOffer.getMetalValue(item) : 0);
                if (metalValue > 0) {
                    cur.metal += metalValue;
                }
            }
        }

        // Fix x.99999 metal values
        if (cur.metal % 1 >= 0.99) {
            cur.metal = Math.round(cur.metal);
        }
    }

    accept() {
        return new Promise((resolve, reject) => {
            this.tradeoffer.accept((err, status) => {
                if (err) {
                    reject(AutomaticOffer.getOfferError(err));
                } else {
                    Confirmations.addOffer(this.tid);
                    Confirmations.check();
                    resolve(status);
                }
            });
        });
    }
    decline() {
        return new Promise((resolve, reject) => {
            this.tradeoffer.decline((err, status) => {
                if (err) {
                    reject(AutomaticOffer.getOfferError(err));
                } else {
                    resolve(status);
                }
            });
        });
    }

    determineEscrowDays() {
        return new Promise((resolve, reject) => {
            this.tradeoffer.getUserDetails((err, my, them) => {
                if (err) {
                    return reject(err);
                }

                const myDays = my.escrowDays;
                const theirDays = them.escrowDays;
                const items = this.exchange;
                let escrowDays = 0;

                if (items.theirs.length > 0 && theirDays > escrowDays) {
                    escrowDays = theirDays;
                }

                if (items.ours.length > 0 && myDays > escrowDays) {
                    escrowDays = myDays;
                }

                resolve(escrowDays);
            });
        });
    }

    static fmtid(tid) { return (+tid).toString(36).toUpperCase(); }
    partner64() { return this.tradeoffer.partner.toString(); }
    partner3() { return this.tradeoffer.partner.getSteam3RenderedID(); }
    offerid() { return AutomaticOffer.fmtid(this.tid); }
    state() { return this.tradeoffer.state; }
    stateName() { return TradeOfferManager.ETradeOfferState[this.state()]; }
    isGlitched() { return this.tradeoffer.isGlitched(); }
    isOneSided() { return this.exchange.ours.length === 0 || this.exchange.theirs.length === 0; }
    isGiftOffer() { return this.exchange.ours.length === 0 && this.exchange.theirs.length > 0; }
    log(level, msg) { Automatic.log[level](`${this.partner3()} Offer ${this.offerid()} ${msg}`); }

    logDetails(level) {
         this.log(level, `Offer details:\r\n${this.summary({includeBuyOrders: false})}`);
    }

    fromOwner() {
        let owners = (Automatic.config.get().owners || []);
        return owners.indexOf(this.partner64()) !== -1;
    }

    abandon(opts={}) {
        if (opts.recheck) {
            this.log("warn", "Some items are missing app_data (Steam is having issues). Offer will be rechecked in 15 seconds.");
            return Utils.after.seconds(15).then(() => {
                Automatic.manager.pollData = {};
                Automatic.manager._assetCache = {};
                this.log("verbose", "Rechecking offer...");
            });
        }
    }
}

module.exports = AutomaticOffer;
module.exports.register = (automatic) => {
    Automatic = automatic;
};