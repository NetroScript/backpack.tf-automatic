const Utils = require('./utils');
const backpack = require('./backpacktf');
const Login = require('./login');
const Confirmations = require('./confirmations');
const appConsole = require('./console');

let steam, log, Config, manager, automatic;

let communityCookies;
let g_RelogInterval = null;

exports.checkOfferCount = checkOfferCount;
exports.register = (Automatic) => {
    steam = Automatic.steam;
    log = Automatic.log;
    Config = Automatic.config;
    manager = Automatic.manager;
    automatic = Automatic;

    Login.register(Automatic);

    steam.on('debug', msg => log.debug(msg));
    steam.on('sessionExpired', relog);
};

function saveCookies(cookies, quiet) {
    communityCookies = cookies;
    steam.setCookies(cookies);
    if (!quiet) log.info("Logged into Steam!");
    else log.debug("Logged into Steam: cookies set");
}

function getBackpackToken() {
    let acc = Config.account();

    if (acc && acc.bptfToken) {
        return acc.bptfToken;
    }

    return backpack.getToken();
}

exports.connect = () => {
    let acc = Config.account();
    let login;

    if (acc && acc.sentry && acc.oAuthToken) {
        log.info("Logging into Steam with OAuth token");
        login = Login.oAuthLogin(acc.sentry, acc.oAuthToken);
    } else {
        login = Login.promptLogin();
    }

    login.then(saveCookies).then(tryLogin).then(getBackpackToken).then(setupTradeManager).catch((err) => {
        log.error("Cannot login to Steam: " + err.message);
        tryLogin().then(getBackpackToken).then(setupTradeManager);
    });
}

function tryLogin() {
    return new Promise((resolve) => {
        function retry() {
            return tryLogin().then(resolve);
        }

        Login.isLoggedIn().then(resolve).catch(([err, loggedIn, familyView]) => {
            if (err) {
                log.error("Cannot check Steam login: " + err);
                Utils.after.seconds(10).then(retry);
            } else if (!loggedIn) {
                log.warn("Saved OAuth token is no longer valid.");
                Login.promptLogin().then(saveCookies).then(retry);
            } else if (familyView) {
                log.warn("This account is protected by Family View.");
                Login.unlockFamilyView().then(retry);
            }
        });
    });
}

function heartbeatLoop() {
    function loop(timeout) {
	setTimeout(heartbeatLoop, timeout); }
    backpack.heartbeat().then(loop, loop);
}

function setupTradeManager() {

    backpack.heartbeat().then((timeout) => {
        const acc = Config.account();
        if (Confirmations.enabled()) {
            if (acc.identity_secret) {
                log.info("Starting Steam confirmation checker (accepting " + automatic.confirmationsMode() + ")");
                Confirmations.setSecret(acc.identity_secret);
            } else {
                log.warn("Trade offers won't be confirmed automatically. In order to automatically accept offers, you should supply an identity_secret. Type help identity_secret for help on how to do this. You can hide this message by typing `confirmations none`.");
            }
        } else {
            log.verbose("Trade confirmations are disabled, not starting confirmation checker.");
        }

        // Start the input console
        log.debug("Launching input console.");
        appConsole.startConsole(automatic);
        
        if (!g_RelogInterval) {
            g_RelogInterval = setInterval(relog, 1000 * 60 * 60 * 1); // every hour
        }
		
	
        setTimeout(heartbeatLoop, timeout);

        manager.setCookies(communityCookies, (err) => {
            if (err) {
                log.error("Can't get apiKey from Steam: " + err);
                process.exit(1);
            }

            log.info(`Automatic ready. Sell orders enabled; Buy orders ${automatic.buyOrdersEnabled() ? "enabled" : "disabled (type buyorders toggle to enable, help buyorders for info)"}`);
            checkOfferCount();
            setInterval(checkOfferCount, 1000 * 60 * 3);
        });
    }).catch((timeout) => {
        if (timeout === "getToken") {
            backpack.getToken().then(setupTradeManager);
        } else {
            Utils.after.timeout(timeout).then(setupTradeManager);
        }
    });
}

function relog() {
    const acc = Config.account();
    if (acc && acc.sentry && acc.oAuthToken) {
        log.verbose("Renewing web session");
        Login.oAuthLogin(acc.sentry, acc.oAuthToken, true).then((cookies) => {
            saveCookies(cookies, true);
            log.verbose("Web session renewed");
        }).catch((err) => {
            log.debug("Failed to relog (checking login): " + err.message);
            Login.isLoggedIn()
                .then(() => log.verbose("Web session still valid"))
                .catch(() => log.warn("Web session no longer valid. Steam could be down or your session might no longer be valid. To refresh it, log out (type logout), restart Automatic, and re-enter your credentials"));
        });
    } else {
        log.verbose("OAuth token not saved, can't renew web session.");
    }
}

function checkOfferCount() {
    if (manager.apiKey === null) return;

    return Utils.getJSON({
        url: "https://api.steampowered.com/IEconService/GetTradeOffersSummary/v1/?key=" + manager.apiKey
    }).then(([_, response]) => {
        if (!response) {
            log.warn("Cannot get trade offer count: malformed response");
            log.debug(`apiKey used: ${manager.apiKey}`);
            return;
        }

        let pending_sent = response.pending_sent_count,
            pending_received = response.pending_received_count;

        log.verbose(`${pending_received} incoming offer${pending_received === 1 ? '' : 's'} (${response.escrow_received_count} on hold), ${pending_sent} sent offer${pending_sent === 1 ? '' : 's'} (${response.escrow_sent_count} on hold)`);
    }).catch((msg) => {
        log.warn("Cannot get trade offer count: " + msg);
        log.debug(`apiKey used: ${manager.apiKey}`);
    });
}
