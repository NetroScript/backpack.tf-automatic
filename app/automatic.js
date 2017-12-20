let SteamCommunity;
let TradeOfferManager;
let Winston;

try {
    SteamCommunity = require('steamcommunity');
    TradeOfferManager = require('steam-tradeoffer-manager');
    Winston = require('winston');
} catch (ex) {
    console.error("Missing dependencies. Install a version with dependencies (not 'download repository') or use npm install.");
    process.exit(1);
}

const Utils = require('./utils');
const vers = (require('../package.json') || {version: "(unknown)", beta: ""});
let version = vers.version;
if (vers.beta && vers.beta !== version) {
    version = vers.beta + " beta-" + vers.betav;
}

const Config = require('./config');
const logging = require('./logging');
const trade = require('./trade');
const steam = require('./steamclient');
const backpack = require('./backpacktf');

let configlog = Config.init();

let Automatic = {
    version,
    getOwnSteamID() {
        return Automatic.steam.steamID.getSteamID64();
    },
    apiPath(fn) {
        return (Automatic.config.get().backpackDomain || 'https://backpack.tf') + '/api/' + fn;
    },
    buyOrdersEnabled() {
        return !!Automatic.config.get().buyOrders;
    },
    confirmationsMode() {
        return Automatic.config.get().confirmations || "all";
    },
    inverseCurrency(from) { return from === "metal" ? "keys" : "metal"; },
    currencyAvg(cur) {
        let c = Automatic.currencies[cur];
        return c ? (c.low + c.high) / 2 : 0;
    },
    mayExchangeToCurrency(to) {
        const config = Automatic.config.get();
        if (typeof config.currencyExchange !== "object") return false;
        if (config.currencyExchange[Automatic.inverseCurrency(to) + "->" + to] === true) {
            return true;
        }
        return false;
    },
    currencies: {},
    buyOrders: [],
    buyOrdersEtag: "",
};

Automatic.config = Config;
Automatic.steam = new SteamCommunity();
Automatic.steam.username = null;
Automatic.manager = new TradeOfferManager({
    "language": "en",
    community: Automatic.steam,
    "domain": "backpack.tf",
    "pollInterval": 10500
});
let log = Automatic.log = new Winston.Logger({
    "levels": logging.LOG_LEVELS,
    "colors": logging.LOG_COLORS
});

function register(...args) {
    args.forEach(component => {
        if (typeof component === 'string') {
            component = require('./' + component);
        }
        component.register(Automatic);
    });
}

register(
    logging,
    trade,
    backpack,
    steam,
    // use strings as confirmations requires AutomaticOffer, which returns a ref to exports, but the module's exports are overriden
    // with a new ref to class AutomaticOffer (so it's {} inside confirmations)
    'automatic-offer',
    'confirmations'
);

if (configlog) log.info(configlog);
log.info("backpack.tf Automatic v%s starting", version);
if (vers.beta) {
    log.warn("This is a beta version, functionality might be incomplete and/or broken. Release versions can be found here:");
    log.warn("https://github.com/netroscript/backpack.tf-automatic/");
}

process.nextTick(steam.connect);

// Check if we're up to date
Utils.getJSON({
    url: "https://github.com/netroscript/backpack.tf-automatic/raw/master/package.json"
}).then(([body]) => {
    if (!body.version) {
        return log.warn("Cannot check for updates: malformed response");
    }

    let current = version.split('.');
    let latest = body.version.split('.');

    let curv = current[0] * 100000 + current[1] * 10000 + current[2] * 1000;
    let latestv = latest[0] * 100000 + latest[1] * 10000 + latest[2] * 1000;
    if (latestv > curv) {
        log.info("===================================================");
        log.info("Update available! Current: v%s, Latest: v%s", version, body.version);
        log.info("Download it here: https://github.com/netroscript/backpack.tf-automatic");
        log.info("===================================================");
    }
}).catch((msg) => {
    //log.warn("Cannot check for updates: " + msg);
});

process.on('uncaughtException', (err) => {
    log.error([
        "backpack.tf Automatic crashed! Please create an issue with the following log:",
        `crash: Automatic.version: ${Automatic.version}; node: ${process.version} ${process.platform} ${process.arch}; Contact: ${Automatic.getOwnSteamID()}`,
        `crash: Stack trace::`,
        require('util').inspect(err)
    ].join('\r\n'));
    log.error("Create an issue here: https://bitbucket.org/srabouin/backpack.tf-automatic/issues/new");
    process.exit(1);
})

log.warn("Currency exchange is disabled in this release (1.3.1) due to a" +
    " vulnerability. This feature will be enabled again in the" +
    " future.");
