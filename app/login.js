const Utils = require('./utils');
const Prompts = require('./prompts');

let Automatic, steam, log, Config;

exports.register = (automatic) => {
    Automatic = automatic;
    steam = Automatic.steam;
    log = Automatic.log;
    Config = Automatic.config;
    Prompts.register(automatic);
};

function oAuthLogin(sentry, token) {
    return new Promise((resolve, reject) => {
        steam.oAuthLogin(sentry, token, (err, sessionID, cookies) => {
            if (err) reject(err);
            else resolve(cookies);
        });
    });
}

exports.oAuthLogin = oAuthLogin;
function isLoggedIn() {
    return new Promise((resolve, reject) => {
        steam.loggedIn((err, loggedIn, familyView) => {
            if (err || !loggedIn || familyView) {
                return reject([err, loggedIn, familyView]);
            }

            return resolve();
        });
    });
}

exports.isLoggedIn = isLoggedIn;

function parentalUnlock(pin) {
    return new Promise((resolve, reject) => {
        steam.parentalUnlock(pin, (err) => {
            if (err) {
                log.error("Unlock failed: " + err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

exports.unlockFamilyView = () => {
    return new Promise((resolve) => {
        Prompts.familyViewPin()
            .then(parentalUnlock)
            .then(resolve)
            .catch(exports.unlockFamilyView);
    });
};

function promptLogin() {
    return Prompts.accountDetails().then((details) => {
        const acc = Config.account(details.accountName);

        if (acc && acc.sentry && acc.oAuthToken) {
            log.info("Logging into Steam with OAuth token");
            return oAuthLogin(acc.sentry, acc.oAuthToken);
        }

        return performLogin(details);
    });
}

exports.promptLogin = promptLogin;

function performLogin(details) {
    return new Promise((resolve, reject) => {
        steam.login(details, (err, sessionID, cookies, steamguard, oAuthToken) => {
            if (err) {
                // There was a problem logging in
                let errcode = err.message;
                switch (errcode) {
                    case 'SteamGuard':
                    case 'SteamGuardMobile': {
                        let isMobile = errcode === "SteamGuardMobile";
                        Prompts.steamGuardCode(isMobile).then((code) => {
                            details[isMobile ? "twoFactorCode" : "authCode"] = code;
                            performLogin(details).then(resolve, reject);
                        });
                        break;
                    }
                    case 'CAPTCHA':
                        // We couldn't login because we need to fill in a captcha
                        Prompts.CAPTCHA(err.captchaurl).then((code) => {
                            details.captcha = code;
                            performLogin(details).then(resolve, reject);
                        })
                        break;
                    default:
                        // Some other error occurred
                        log.error("Login failed: " + errcode);
                        Utils.after.seconds(20).then(() => performLogin(details).then(resolve, reject));
                }
                return;
            }
            
            Prompts.rememberLogin().then((save) => {
                let account = Config.account(details.accountName) || {};
                account.sentry = steamguard;
                if (save) account.oAuthToken = oAuthToken;
                Config.saveAccount(details.accountName, account);
                
                log.info("Logged into Steam!");
                resolve(cookies);
            });
        });
    });
}