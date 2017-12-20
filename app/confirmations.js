const SteamTotp = require('steam-totp');
const ConfirmationType = require('steamcommunity').ConfirmationType;
const CONFIRMATION_POLL_INTERVAL = 15500;

let automatic, steam, AutomaticOffer;
let enabled = false;
let offerids = {};

let identity_secret = "";

function cm() { return automatic.confirmationsMode(); }
function timenow() { return Math.floor(Date.now() / 1000);}
function totpKey(secret, tag) {
    return SteamTotp.getConfirmationKey(secret, timenow(), tag);
}

exports.enabled = () => {
    return cm() !== "none";
};

const accept = exports.accept = (confirmation, secret) => {
    let cid = "#" + confirmation.id;
    automatic.log.verbose(`Accepting confirmation ${cid}`);
    
    const time = Math.floor(Date.now() / 1000);
    confirmation.respond(time, totpKey(secret, "allow"), true, (err) => {
        if (err) {
            return automatic.log.error(`Error accepting confirmatin ${cid}.`);
        }

        let creator = confirmation.creator;
        let message = `Confirmation ${cid} accepted`;
        let handledByAutomatic = confirmation.type === ConfirmationType.Trade && offerids[creator];

        if (handledByAutomatic) {
            message += ` (belonging to trade offer ${AutomaticOffer.fmtid(creator)})`; 
            offerids[creator] = null;
        }
        
        automatic.log.verbose(message + ".");
    });
};

exports.enable = () => {
    if (enabled) return;
    if (!exports.enabled()) return;

    enabled = true;

    steam.on('confKeyNeeded', (tag, callback) => {
        callback(null, timenow(), totpKey(identity_secret, tag));
    });
    steam.on('newConfirmation', (confirmation) => {
        let mode = cm();
        if (mode === "all") {
            accept(confirmation, identity_secret);
        } else if (mode === "own") {
            if (offerids[confirmation.creator]) {
                accept(confirmation, identity_secret);
            }
        } else if (mode === "own+market") {
            if (offerids[confirmation.creator] || confirmation.type === ConfirmationType.MarketListing) {
                accept(confirmation, identity_secret);
            }
        } // ignore for "none"
    });
    steam.startConfirmationChecker(CONFIRMATION_POLL_INTERVAL);
};

exports.setSecret = (secret) => {
    offerids = {};
    identity_secret = secret;
    exports.enable();
}

exports.check = () => {
    if (!enabled) return;
    steam.checkConfirmations();
};

exports.addOffer = (id) => {
    offerids[id] = true;
};

exports.register = (Automatic) => {
    automatic = Automatic;
    steam = automatic.steam;

    // see ./automatic.js for why
    AutomaticOffer = require('./automatic-offer');
};