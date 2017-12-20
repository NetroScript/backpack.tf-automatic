const open = require('open');
const Utils = require('./utils');

let log, config;

function prompt(prop, errmsg) {
    return Utils.prompt({"prop": prop}).then(res => res.prop).catch(err => Utils.fatal(log, errmsg.replace('%e', err.message)));
}

exports.register = (automatic) => {
    log = automatic.log;
    config = automatic.config;
};

exports.familyViewPin = () => {
    return prompt({
        "description": "Family View PIN (hidden)",
        "type": "string",
        "required": true,
        "hidden": true
    }, "Cannot read PIN: %e");
};

exports.steamGuardCode = (isMobile) => {
    return prompt({
        "description": ("Steam Guard" + (isMobile ? " app" : "") + " code").green,
        "type": "string",
        "required": true
    }, "Cannot read auth code: %e");
};

exports.CAPTCHA = (url) => {
    open(url);
    return prompt({
        "description": "CAPTCHA".green,
        "type": "string",
        "required": true
    }, "Cannot read CAPTCHA: %e");
};
exports.backpackToken = () => {
    return prompt({
        "description": "backpack.tf token".green,
        "type": "string",
        "required": true,
        message: "Find yours at backpack.tf/settings > Advanced"
    }, "Cannot read backpack.tf token: %e");
}

exports.accountDetails = () => {
    return new Promise((resolve) => {
        Utils.prompt({
            "username": {
                "description": "Steam username".green,
                "type": "string",
                "required": true,
                "default": config.lastUsedAccount()
            },
            "password": {
                "description": "Steam password".green + " (hidden)".red,
                message: "Password is hidden",
                "type": "string",
                "required": true,
                "hidden": true
            }
        }).then((result) => {
            const accountName = result.username.toLowerCase(),
                password = result.password;
            resolve({accountName, password});
        }).catch((err) => {
            Utils.fatal(log, "Cannot read Steam details: " + err.message);
        });
    })
}

exports.rememberLogin = () => {
    return new Promise((resolve) => {
        require('prompt').confirm("Remember login?".green, {"default": "yes"}, (err, save) => {
            if (err) Utils.fatal(log, "Cannot get answer: " + err);
            else resolve(save);
        });
    });
};
