# Glossary

One vocabulary for Grandpa Shop. Code, sketches, and the roadmap use these words. A new word is added here before it shows up as a type. There are no domain types in the modules yet. The model step of a slice is what turns a term into a type.

The collection belongs to one person. Sync, accounts, and prices are not terms yet. The transport and the conflict model are still open. See [docs/decisions](docs/decisions/README.md).

## Card

A Yu-Gi-Oh card as a game piece: the name, the kind (Monster, Spell, or Trap), and the text and stats that stay the same across printings.

## Printing

One printing of a card in a set. It carries the set code, the rarity, the edition, and the language. Two printings can be the same card.

## Copy

One physical card in the collection. It is a printing plus a condition. It sits in a binder slot, or it is unfiled.

## Collection

Every copy Víctor owns. There is one collection.

## Binder

A physical binder of pages.

## Page

One side of a binder sheet. Pages in a binder have an order.

## Spread

Two facing pages of a binder, seen together: pages 1 and 2, then 3 and 4. Turning the binder moves one spread.

## Slot

One pocket on a page. A slot holds one copy, or it is empty.

## Catalogue

Every card and printing that exists, as reference data from outside the collection. The catalogue is read-only. A copy is made by picking a printing from it.

## Set

A Yu-Gi-Oh product a printing comes from: a core set, a structure deck, a tin, or another product.

## Rarity

How scarce a printing is marked: Common, Rare, Super Rare, Ultra Rare, Secret Rare, and the other printed rarities. The full list is not closed here. The slice that stores a rarity names the ones it accepts.

## Condition

The wear of a copy: Near Mint, Lightly Played, Moderately Played, Heavily Played, or Damaged.

## Edition

1st Edition or Unlimited, when the printing distinguishes them.

## Language

The language printed on a printing.

## Passcode

The eight-digit number printed on a card, when it has one.

## Finish

Whether a printing is foil. The named foil treatments are not listed yet. A slice that cares about finish extends this entry instead of inventing a parallel word.

## Monster stats

Attribute, monster type, level, rank, link rating, ATK, and DEF describe a monster card. Spell and trap cards do not have them.

## Not named yet

Wishlist, deck, trade list, price, and user account. Do not add them as types until a frame gives them a glossary entry.
