# backpack.tf Automatic User Guide

backpack.tf Automatic is a trade bot available free of charge to anyone, the only requirements to use it are:

* You need a non-limited Steam account
* You need to have logged into backpack.tf at least once
* You must not be banned on backpack.tf or SteamRep

Automatic uses the backpack.tf Classifieds to determine which items you are selling and buying.

To have the bot handle offers, it must be running. If you close it, it will stop handling offers. Offers that can be accepted automatically are marked with a lightning bolt insted of a trade offer icon.

As the system is open, not all lightning bolt users actually run Automatic. Anyone using our API can enable the bolt for their own bot's listings as well.

Listings will automatically be bumped if the user has Automatic running and their perks (donation, premium) support it.

As of version 1.3.0, Automatic now supports buy listings along with sell listings. It must be enabled inside the bot (off by default). Bot owners will usually mention having it enabled. This is currently not reflected on the site, however, it is planned.

Buy orders are updated inside Automatic every heartbeat, which occurs every 5 minutes or when the heartbeat command is used inside Automatic. Heartbeats also cause your listings to be bumped if applicable.

By default, Automatic handles change too, however just metal and craft weapons (equal to 1/2 a scrap). A bot owner can tinker with the settings to also support keys being converted to metal and vice-versa for the sake of calculations. However, this is not the default. The bot owner's keys must be craftable if you treat them as change. (event keys, such as old winter keys, turned uncraftable after the event ended)

Bot owners can optionally provide their identity_secret to Automatic, which lets it accept trade confirmations automatically. Not everyone has this enabled, but it is an option.

Trade confirmations are checked every 15 seconds, pending trade offers are checked every 10 seconds. Your offer should be handled within 30 seconds unless Steam is having issues. If it's not, it's likely your trade offer wasn't valid. This can be because the bot owner has several settings enabled or disabled, such as automatic trade confirmations. The listing will usually mention "fast accept" instead of "instant accept" then.

In order to trade with a bot owner, you must not be banned on backpack.tf, banned by SteamRep, and you must also have your mobile authenticator set up. Although it's possible for the bot owner to disable the enforcement of these criteria, it is not the default and very, very few owners change these settings.


If you're interested in running your own bot, see the README in this repository. Automatic is available completely free of charge to anyone :)