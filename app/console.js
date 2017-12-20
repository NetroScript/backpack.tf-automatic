const configToggles = "acceptGifts declineBanned acceptEscrow buyOrders".split(" ");
const configToggleNames = configToggles.map(name => name.toLowerCase());
const help = {
    identitysecret:
`If you have the Steam Guard Mobile Authenticator enabled and you've extracted your keys from your phone (via rooting or jailbreaking), you can use identity_secret <your identity_secret key> and Automatic will accept all trade confirmations automatically for you.
  IMPORTANT: This will accept **all** trade confirmations, not just ones for offers that Automatic has accepted!

Guides for extracting your identity_secret are available on the backpack.tf forums:

- Android, http://forums.backpack.tf/index.php?/topic/46354-/
- iOS, http://forums.backpack.tf/index.php?/topic/45995-/

If you use Steam Desktop Authenticator, first disable encryption if you haven't already (you can re-enable it later). Then, find the folder where you extracted it and open the maFiles folder. Open the .maFile that corresponds to your Steam account in a text editor and find something that looks like this:

"identity_secret":"xxxxxxxxxxxxx"

Then type identity_secret <thing in quotes>`,
    heartbeat: "Force-send a heartbeat to backpack.tf. This refreshes your buy orders, currency conversion data, and bumps your listings if applicable.",
    logout: "Logs you out of your account by deleting your OAuth token and closes Automatic. Use `logout keep` to keep your OAuth token so you can log in again once you enter your credentials.",
    toggle: "Toggles a config setting. Available settings: " + configToggles.join(", ") + ". Type help <setting> to find out what it does. Type <setting> (as a command) to find out whether it's enabled. Type toggle <setting> or <setting> toggle to toggle it.",
    acceptgifts: settinghelp('acceptGifts', 'Enable this setting to accept offers where you will receive items without offering any ("for free")'),
    declinebanned: settinghelp('declineBanned', 'Enable this setting to accept offers from users marked as a scammer or banned on backpack.tf (not recommended)'),
    acceptescrow: settinghelp('acceptEscrow', 'Enable this setting to accept offers even if they incur an escrow period. Type acceptescrow decline to automatically decline escrow offers.'),
    buyorders: settinghelp('buyorders',
`Enable this setting to enable or disable buy orders being handled by Automatic. Use the heartbeat commands afterwards to update your buy orders. (Buy orders are handled inside the application)

*Important*:
Items marked as 'Allow negotiation' (blue trade offer icon on the site) will not be accepted automatically. Use 'Offer buyout only' (green icon). This is so you can disable buy offer handling per-item.

Gotchas:
- We don't check whether an item has a paint, spell, etc. applied. Only primary quality and killstreak level (not sheen) are checked. Use the above exception for such buy orders.
- Again: second quality is not checked as it is currently unsupported in buy orders by backpack.tf (sell orders are okay with them though). This may be added at a future date when secondary quality buy orders are supported by backpack.tf.
- This includes the amount on noise makers and other items that have limited uses. The bot will accept those items if you asked for them on backpack.tf regardless of the amount of uses left (there will always be at least 1).
- Users cannot currently choose weapon change on your end, this might be changed later.
- Buy orders and sell orders can be handled in the same offer. Item-item exchanges with the same value as listed by you are supported (say, you're selling an item for 10 ref and buying one for 10 ref, it will accept them 1:1). There's no way to disable this.
- Unusual effects are implemented, however killstreakifiers are not. To buy an unusual item with any particle effect, simply create a listing of the item without an associated particle.
Example with particle: http://backpack.tf/stats/Unusual/Dragonborn%20Helmet/Tradable/Craftable/62
Example without particle: http://backpack.tf/stats/Unusual/Dragonborn%20Helmet/Tradable/Craftable`),
    confirmations: () =>
`<confirmations: ${automatic.confirmationsMode()}>
Accept trade confirmations automatically. identity_secret must be provided first, see help identitysecret.

Possible options are:
- all (default): automatically accept all trade confirmations, including market confirmations
- own: only accept trade confirmations from trade offers accepted by Automatic.
- own+market: accept trade confirmations from trade offers accepted by Automatic, plus all market confirmations
- none: disable this feature`,
    exchange: () => {
        let ce = Config.get().currencyExchange || {};
        return ""+
`<exchange.metal->keys: ${ce["metal->keys"] ? "enabled" : "disabled"}
<exchange.keys->metal: ${ce["keys->metal"] ? "enabled" : "disabled"}
Toggles currency exchange for the sender's side of the trade, using backpack.tf community suggested currency values. The mid price (average price) is used ((low + high)/2). This affects any item values too, for example:

Trade: 1 key = 5 ref; ours=<selling item for 1 key 3 ref>; theirs=<8 ref>
This trade will only be accepted with metal->keys enabled.
Trade: 1 key = 5 ref; ours=<3 keys>; theirs=<item worth 2 keys, 3 ref>,<2 ref>;
This trade will only be accepted with keys->metal enabled.

Format: exchange toggle metal->keys or exchange toggle keys->metal
Note that the sender can add any amount of currency to your side and then add an exchange-equivalent amount on their end to make the deal fair according to the prices, however, they can basically trade purely to exchange currency this way.
Therefore, it's important to only have this enabled when you aren't trading keys for metal.`;
    },
    help: "Shows help for entered command."
};

const commands = {
    identitysecret(data, acc) {
        if (!data) {
            console.log("Usage: identity_secret <base64 identity_secret for your account>");
            return;
        }

        acc.identity_secret = data;
        Config.saveAccount(acc);
        console.log("identity_secret saved. Using trade confirmation mode: " + automatic.confirmationsMode() + ". (help confirmations for info)");
        require('./confirmations').setSecret(data);
    },
    toggle(data) {
        let name = data.toLowerCase();
        if (configToggleNames.indexOf(name) === -1) {
            return console.log(`Unknown config toggle: ${name}. List: ${configToggles.join(", ")}`);
        }
        commands[name]("toggle");
    },
    acceptgifts: settingToggleHandler("acceptGifts"),
    declinebanned: settingToggleHandler("declineBanned"),
    acceptescrow: settingToggleHandler("acceptEscrow", "decline", () => {
        let config = Config.get();
        config.acceptEscrow = "decline";
        Config.write(config);
        console.log(`Set acceptEscrow to "decline".`);
    }),
    buyorders: settingToggleHandler("buyOrders"),
    confirmations(data) {
        let mode = data.toLowerCase();
        if (mode !== "all" && mode !== "own" && mode !== "own+market" && mode !== "none") {
            return console.log("Unsupported trade confirmation mode `" + mode + "`. Use `help confirmations`.");
        }

        if (mode === automatic.confirmationsMode()) {
            return console.log("The trade confirmation mode is already `" + mode + "`.");
        }

        let config = Config.get();
        config.confirmations = mode;
        Config.write(config);
        console.log(`Set confirmations to "${mode}".`);
    },
    exchange(data, _, linedata) {
        let type = (linedata.split(' ')[1] || "").toLowerCase();

        if (data !== "toggle" || (type !== "metal->keys" && type !== "keys->metal")) {
            return console.log("Format: exchange toggle {metal->keys,keys->metal}");
        }

        let config = Config.get();
        if (typeof config.currencyExchange !== "object") config.currencyExchange = {};
        let now = (config.currencyExchange[type] = !config.currencyExchange[type]);
        Config.write(config);
        console.log(`Now ${now ? "allowing" : "disallowing"} currency exchanges from ${type}`);
    },
    heartbeat() {
        require('./backpacktf').heartbeat();
    },
    logout(data, acc) {
        if (data.toLowerCase() === "keep") {
            Config.setLastUsed("");
        } else {
            delete acc.oAuthToken;
            Config.saveAccount(acc);
        }

        console.log("Logged out successfully.");
        process.exit(0);
    },
    help(data) {
        let cmd = serializeCommand(data);
        if (help[cmd]) {
            console.log(typeof help[cmd] === "function" ? help[cmd]() : help[cmd]);
        } else {
            showCommands();
        }
    },
    '.debug': (data, acc, linedata) => {
        // undocumented
        try { console.log(eval(linedata)); } catch (ex) { console.error(ex);}
    },
    '.rpd': () => {
        automatic.manager.pollData = {};
    }
};

function showCommands() {
    console.log("Commands: " + Object.keys(commands).filter(command => command[0] !== '.').join(", "));
    console.log("Use help [command name] for help on that command. Use <TAB> to autocomplete.");
}

function serializeCommand(command) {
    return (command || "").replace('_', '').toLowerCase();
}

function settinghelp(conf, str) {
    return () => `<${conf}: ${Config.get(conf) ? "enabled" : "disabled"}>\r\n${str}`;
}

function settingToggleHandler(name, custom, customHandler) {
    return function (data) {
        data = data.toLowerCase();

        let conf = Config.get(name);
        if (custom && data === custom) return customHandler();
        if (data !== "toggle") {
            console.log(`${name}: ${typeof conf === "string" ? '"conf"' : (conf ? "enabled" : "disabled")}`);
            return;
        }

        if (typeof conf === "string") {
            console.log(`${name} cannot be toggled, its current value is "${conf}".`);
            return;
        }

        let config = Config.get();
        let enabled = (config[name] = !conf);
        Config.write(config);
        console.log(`${enabled ? "Enabled" : "Disabled"} ${name}.`);
    };
}

function completer(line) {
    const completions = Object.keys(commands);
    const hits = completions.filter((c) => { return c.indexOf(line) === 0 });
    return [hits.length ? hits : completions, line];
}

let automatic, Config;

exports.startConsole = (Automatic) => {
    let input = require('readline').createInterface({input: process.stdin, output: process.stdout, prompt: 'automatic> ', completer});
    automatic = Automatic;
    Config = Automatic.config;

    input.on('line', function(line) {
        let acc = Config.account(),
            parts = line.split(' ');

        let command = serializeCommand(parts[0]);
        let data = parts[1] || "";
        let linedata = parts.slice(1).join(' ');

        if (commands[command]) {
            commands[command](data, acc, linedata);
        } else {
            console.log("Unknown command: " + parts[0]);
            showCommands();
        }
    });
};