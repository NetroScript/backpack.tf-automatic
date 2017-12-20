# 1.3.1
This is a mandatory update to work around a security vulnerability related to
currency exchange logic. This update temporarily disables the currency 
conversion feature, which will be reintroduced in a future patch. Clients 
with a version <1.3.1 will be forced to update.

# 1.3.0
Implemented buy orders. See readme or type help buyorders on how to enable this and how it works.
Implemented trade confirmation modes. Now, you can choose to only accept offers if they were accepted by Automatic (offers you sent won't be accepted automatically).
Implemented currency conversions. Type help exchange for info.
New account system, accounts are stored in accounts.json now. If you had multiple logins before (few people do), you will have to log in again.
Improved console:
    - added commands: heartbeat, toggle, acceptgifts, declinebanned, acceptescrow, buyorders, confirmations
    - help now shows help for the command.
    - auto complete commands with tab
Removed acceptOverpay setting, it is now standard behavior.
Removed acceptedKeys setting as it would be conflicting with buy orders.

# 1.2.8
Fixed some items in trade offers crashing Automatic.

# 1.2.7
Fixed most session expiration issues.
Trade offer completion notifications are now only sent to backpack.tf when the offer went through (confirmed), not just after it's been accepted.

# 1.2.6
Fixed several bugs introduced in 1.2.5 as well as pre-existing ones
Added acceptEscrow: "decline" to automatically decline escrow offers.
Added custom log file names. Add "filename": "file" to logs.file and/or logs.trade. Any directories used must be created first.
Added a message to copy for crash reporting. These are saved to your Automatic log so you can report the crash after you closed the window.
The functionality of acceptGifts has been changed and is now more straightforward. Now, if it's true, gift offers where you receive items without giving any will be accepted.

Report issues here: https://bitbucket.org/srabouin/backpack.tf-automatic/issues/new