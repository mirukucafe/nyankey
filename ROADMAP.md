# FoundKey Goals
Note: this document is historical.
Everything starting with the next section is the original "idea" document that led to the foundation of FoundKey.

For the current status you should see the following:
* Issues labeled with [behaviour-fix](https://akkoma.dev/FoundKeyGang/FoundKey/issues?labels=44)
* Issues labeled with [upkeep](https://akkoma.dev/FoundKeyGang/FoundKey/issues?labels=43)
* Issues labeled with [feature](https://akkoma.dev/FoundKeyGang/FoundKey/issues?labels=42)

## Misskey Goals
I’ve been thinking about a community misskey fork for a while now. To some of you, this is not a surprise. Let’s talk about that.

## Why a Fork?
Misskey is the ever evolving social platform. But some sheer coincidence, the state it was in in summer 2021 happened to be close to what our little fedi bubble has mostly wanted for a long time. Closer than anything else, but not necessarily it.

There are some glaring issues. For example, conversation mutes don’t mute notifications. According to syuilo, this is [intended behavior](https://github.com/misskey-dev/misskey/issues/8102#issuecomment-1035080526). The point is that whatever change we might want to make for ourselves would need to be accepted by the wider misskey community (possible, but not obvious) and syuilo in particular (harder).

By having a community fork, we can avoid any potential future changes that turn misskey into yet another direction, while refining the things we already like, all without needing to worry about ruining the fun for someone else. And without “supervision from above”, which is often the enemy of creative work.

## What Changes?
The direction I’d like to see misskey go in involves a couple of different subcategories of changes. Behaviour fixes, technological upkeep, and new features. Let’s go through them. (Note that this list is not “complete”, but here to offer a representative selection of the kinds of changes to expect - the best place to look for specifics will be the kanban board once the fork is up!)

### Behaviour Fixes
Some things misskey does just don’t seem right. Mutes don’t work properly. The timeline behaviour is oddly arbitrary. Sometimes things don’t federate properly (if anything it’s a miracle things do federate as often as they do!). Maximum note length is no longer configurable, and while there was a [suggestion](https://github.com/misskey-dev/misskey/issues/8323) that that might change, it’s been a while now.
Anything that doesn’t fit to our communal standards, we fix.

### Technological Upkeep
Misskey’s tech stack has some glaring inconsistencies. MFM is a fairly poor ad-hoc parser, so it would be nice to rewrite it as a set of extensions to marked. Some features are simply not used, and can be ripped out (which ones will depend on communal consensus). Some UI components and DB queries are slow - we make them faster. Misskey has no true JSON-LD support, but JS does have a “legitimate” library for it - maybe we should use that.
An attempt to provide serious documentation will be started, and can be rather complete (since we no longer need to worry about sudden *uninformed* changes; see governance) eventually, which will be useful to some rewrites (such as misskey-go, which may consider targeting us for the rewrite eventually).
These are all less changes to behaviour, but rather ways to make misskey a better piece of software overall.

### New Features
There are plenty of things, back in the summer of 2021, that we looked at, went “cool!!” and then found out were lacking. Or things we wished there were.
Better drive management. Federation for groups. Nicer UX (such as deleting things!) for galleries and pages. Letting the database clean itself (built-in forget, including for remote posts).
These are all “new” features that would be hard to justify to the wider community (I still remember someone asking us why “the western community seems to think everything should be federated”), but once it’s implemented is easier to just merge in.
New features that we want to see in the software.

### The Elephant in the Room
While I do fully intend to do as much of the above as possible - I’m just one person. Not one with a high capacity for creative output either (by now you lot probably have seen just how long it can take me to do even small things).
There’s a reason I’m talking about it as a “community fork”, and not “my fork”. So let’s talk about governance.

## Governance
Assuming the offer is still available, the fork will reside on akkoma.dev and use akkoma’s CICD tools - we’re part of the same fedi bubble, and floaty has offered to facilitate this process as a whole.

Push access will be granted liberally as long as:
1. The person is in the general fedi community (i.e has the same general priorities, definitionally).
2. The person has contributed to the project at some point (just to avoid non-devs etc taking up push access and doing nothing with it).

Anyone with push access can request someone else to be granted push access (given the above) and such requests will generally not be refused.

The branch layout will be modified: the “main” branch will contain development data, and tags (starting with 200.1.0, following semver from there, to avoid conflicts) will be used for releases. This minimizes backport efforts.
There will also be a “syuilo” branch (at least initially) that will contain misskey develop (synced manually on occasion), for easier switching and cherry-picking.

There will be no consequences for “pushing bad code”, unless it was clearly done maliciously (unlikely). Running main will indeed be potentially awkward. Tags will be checked for issues before tagging, however. Similarly, it’s important to make sure any documentation-visible changes are discussed and informed of before a tag is made, so that the docs are up to date! In short, the only seriously “controlled” part will be the tag/release process. Exact details will depend on the set of people that will end up with push access.

I will also be dedicating some amount of time each week specifically to going over MRs and issues. I hope some other people with push access will do the same.

## And So
Is this something we want? As I mentioned, my capacity for output simply isn’t great enough to truly do all the things I’d like to see happen, so if this level of ambition is to ever be met, I’ll need the community to actually be interested and participate.
Hopefully, I do understand what we all want to some degree, and hopefully I’ve outlined a sufficiently friendly environment for people to be comfortable wanting to work on it.
Please tell me what you think!
If this does not turn out to be as interesting, a fork could still happen, but may also be significantly less ambitious (namely aiming for bug fixes and integration of my olde patches).
