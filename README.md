# Personal Note #

* This is a "fixed" version of the old node backpack.tf-automatic
* This means it still bumps the listings and displays as useragent since the latest API changes
* This is an older version of automatic so you won't have any of the changes from the newer versions
* The only things I tested (because I use them) is bumping and displaying the flash icon on backpack.tf (and ofc the other stuff like automatically accepting), I won't add any support for buyorders by myself in this versions
* Use this at your own risk
* Wait for the new API version of backpack.tf and the a new automatic (hopefully) then
* This version does **NOT** fix any mistakes like the exploit with australiums
* If you don't like this feel free to try out a [python version](https://github.com/mninc/automatic-v2)
* If you need a new token generate one [here](https://backpack.tf/connections)


Below the old readme (don't forget that most links won't work anymore)


# backpack.tf Automatic #

*Read this carefully before doing anything, it contains a full set of instructions. Read past the download links before asking for help.*

Are you looking to trade with someone using Automatic, and want to know how it works and what you can do? See the [user guide](user-guide.md). If you're a bot owner it might also be worth your time reading this.

### What is this for? What does it do? ###

* Automatically accept incoming offers that match your buy and sell listings on [backpack.tf](http://backpack.tf).
* Supports multiple listings in a single offer, even both types. Users can even trade items you're selling for items you're buying, adding change if necessary.
* Automatically rejects any incoming offer from a banned user or tagged scammer.
* Only TF2 offers are supported as the other economies on Steam lack a small denominator of currency such as metal.
* By default, the bot will handle change as part of the trade offer in metal only. If you're asking for 1 key, it will not accept anything else than 1 key. If you're asking 8.33 refined for an item and the buyer offers 9 refined while asking the item + 2 reclaimed metal back, it will process the offer normally.
* This can be changed with the currency exchange feature (not recommended if you have Mann Co. Supply Crate Key listings however).
* 'Ghost' trade offers, where items are unavailable, are automatically declined. Normally it's not possible to decline them manually.
* Every 5 minutes a heartbeat is dispatched to the backpack.tf server. This allows us to identify which users are currently running the bot and switching the trade offer button to an automatic trade offer button. Additionally, your listings are bumped if applicable (according to your donation or premium perks), community suggested currency exchange rates are updated, and your buy orders are updated. This can be done manually with the `heartbeat` command.
* Multiple accounts are supported, use the `logout` command to change account.
* Trade confirmations can be accepted by the bot automatically, see below. You can choose between all offers (including market), only offers accepted by Automatic, offers accepted by Automatic and all market listings, or none.

View the changelog [here](CHANGELOG.md).

### Easy install - Windows ###
* [Download the latest stable Windows version](https://bitbucket.org/srabouin/backpack.tf-automatic/downloads) and *unpack it to a folder of your choice*, it will not work if you do not unpack it.
* Note: occassionally beta versions will be available, it's recommended you use a stable version first unless you're looking to try out the new features however. Beta versions do not come with a standalone version of nodejs, so you will have to install it manually (see Mac & Linux installation ). Planned and added features to each beta are listed in the changelog.
* If you have node.js installed, you can use a version ending in -all instead. These do not come bundled with nodejs, so they are a slimmer download.
* Double-click automatic.bat.
* If you get an error and you've completed everything above, please try to restart your computer. Sometimes a reboot is necessary for node to function properly on certain systems.

* Fill in the details. See the [Running the application](#running-the-application) section below.

### Easy install - Mac and Linux ###
* Install [Node.js](https://nodejs.org/en/download/current/) - 32 bit version for 32 bit systems or 64 bit version for 64 bit systems (4.0.0 minimum).
* [Download the latest stable version](https://bitbucket.org/srabouin/backpack.tf-automatic/downloads) (ending in -all) and *unpack it to a folder of your choice*, it will not work if you do not unpack it.
* Note: occassionally beta versions will be available, it's recommended you use a stable version first unless you're looking to try out the new features however. Planned and added features to each beta are listed in the changelog.
* Run automatic.sh or run `node automatic` in the terminal/console.

* Fill in the details. See the [Running the application](#running-the-application) section below.

### Running the application ###

* The bot will ask you for your Steam details and your backpack.tf third party access token (not your api key). You can find your token on your [Settings](http://backpack.tf/settings) page, in the "Advanced" section.
* You can get your Steam Guard code from your email or app (only valid once). If you have family view enabled, you will also have to give your PIN.
* *Your password will be hidden during setup, it will still accept keystrokes. Use enter to submit as usual.*
* Place the items you are selling at the beginning of your backpack so they are easier to find, especially if you have multiple identical items and only selling one. backpack.tf relies on the item id, so if the person sending you a trade offer picks the wrong item, the offer will not be automatically accepted as it will not be able to match your item. By placing it at the beginning of your backpack and then creating a listing for your item, you will ensure the proper item is easily accessible.
* To enable buy order support, type `toggle buyorders`. For items you wish not to be handled by Automatic, you can set the listing to 'Allow negotiation' instead of 'Offer buyout only'. Scroll down for some gotchas.
* Currency exchange can be enabled with `exchange toggle` (see `help exchange`). Do not enable currency exchange if you're going to be trading keys for metal in the Classifieds.
* To find out more about available settings, use the `help` command (use `help <command name>` for more info on that command.)

### I get a specific error when I start the bot, what does it mean? ###
#### 'node' is not recognized as an internal or external command, operable program or batch file ####
Restart your computer.

#### %1 is not a valid Win32 application.
You need to install the proper versions for your Windows bitness (32 or 64 bit). So if you have a 32 bit Windows install, everything has to be 32 bit. If it's 64 bit, everything has to be 64 bit.

#### Cannot find module '...' (commonly 'C:\Windows\system32\bot')
Unzip the bot somewhere you like (such as your desktop folder).


You can also try to update your version of nodejs (download links above). Newer versions of automatic require at least version 4.0.0.
### identity_secret Guide ###

Type `help identitysecret` in the console window.

Guides for extracting your identity_secret are available on the backpack.tf forums:

- Android, http://forums.backpack.tf/index.php?/topic/46354-/
- iOS, http://forums.backpack.tf/index.php?/topic/45995-/

### Buy Order Gotchas ###

*Important*:
Items marked as 'Allow negotiation' (blue trade offer icon on the site) will not be accepted automatically. Use 'Offer buyout only' (green icon). This is so you can disable buy offer handling per-item.

- We don't check whether an item has a paint, spell, etc. applied. Only primary quality and killstreak level (not sheen) are checked. Use the above exception for such items.
- Again: second quality is not checked as it is currently unsupported in buy orders by backpack.tf (sell orders are okay with them though). This may be added at a future date when secondary quality buy orders are supported by backpack.tf.
- This includes the amount on noise makers and other items that have limited uses. The bot will accept those items if you asked for them on backpack.tf regardless of the amount of uses left (there will always be at least 1).
- Buy orders and sell orders can be handled in the same offer. Item-item exchanges with the same value as listed by you are supported (say, you're selling an item for 10 ref and buying one for 10 ref, it will accept them 1:1). There's no way to disable this.
- Unusual effects are implemented, however killstreakifiers are not. To buy an unusual item with any particle effect, simply create a listing of the item without an associated particle.
Example with particle: http://backpack.tf/stats/Unusual/Dragonborn%20Helmet/Tradable/Craftable/62
Example without particle: http://backpack.tf/stats/Unusual/Dragonborn%20Helmet/Tradable/Craftable
- Buy orders are updated every 5 minutes. Use `heartbeat` to force an update.

### Who do I talk to if I run into problems, want to report a bug, or want to suggest features? ###

* Please use the [issues](https://bitbucket.org/srabouin/backpack.tf-automatic/issues?status=new&status=open) section of this repo for bug reports and feature suggestions.
* Ask the community for help on the [backpack.tf forums](http://forums.backpack.tf/index.php?/topic/20204-backpacktf-automatic-help-thread/).

# License #

Backpack.tf Automatic is released under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International license](http://creativecommons.org/licenses/by-nc-sa/4.0/).
