# Glossary

One vocabulary for Grandpa Shop. Code, sketches, and the roadmap use these words. A new word is added here before it shows up as a type. There are no domain types in the modules yet. The model step of a slice is what turns a term into a type.

The collection belongs to one person. Sync and accounts are not terms yet. The transport and the conflict model are still open. See [docs/decisions](docs/decisions/README.md).

## Card

A Yu-Gi-Oh card as a game piece: the name, the kind (Monster, Spell, or Trap), and the text and stats that stay the same across printings.

## Printing

One printing of a card in a set. It carries the set code, the rarity, the edition, and the language. Two printings can be the same card.

## Copy

One physical card in the collection. It is a printing plus a condition. It sits in a binder slot, or it is unfiled.

## Collection

Every copy Víctor owns. There is one collection.

## Shelf

The named binders in the collection, in the order they were added. At most one binder is open at a time; while none is open, the shelf itself is shown.

## Binder

A physical binder of pages.

## Page

One side of a binder sheet. Pages in a binder have an order.

## Spread

What an open binder shows at once. Page 1 and page 2 are the two sides of one sheet, so they never face each other. The first spread is page 1 alone, on the right of the inside cover. Then pages 2 and 3 face each other, then 4 and 5, and the last page of an even-paged binder sits alone on the left. Turning the binder moves one spread.

## Slot

One pocket on a page. A slot holds one copy, or it is empty.

## Catalogue

The cards and printings known to an outside source, as reference data apart from the collection. The catalogue is read-only. A copy is made by picking a printing from it. It holds only what its source carries: today that is YGOPRODeck, which lists English printings and does not mark the edition, so edition and language are absent from its printings until another source supplies them.

## Set

A Yu-Gi-Oh product a printing comes from: a core set, a structure deck, a tin, or another product.

A set is known by its exact name. Most of its printings' set codes start with the same letters before the hyphen, such as TLM in TLM-EN001; a code with no hyphen is its own prefix. The most common of these is the set's prefix, the first in set-code order on a tie. It is not unique: a core set, its sneak peek, and its special edition can share one, and a few sets mix prefixes.

## Print run

The part of a printing's set code before its number, such as LOB-EN in LOB-EN001. A code with no hyphen or no trailing number is its own print run. In early core sets each print run is a separate release, such as LOB-, LOB-E, and LOB-EN for Legend of Blue Eyes White Dragon. In some boxes, such as Speed Duel, it marks a deck in the box.

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

## Cardmarket product

A printing as Cardmarket sells it, known by a stable numeric id. Cardmarket draws its product lines differently from the catalogue, so several printings can share one product, and a product can match no printing in the catalogue. The product table, generated and committed in the repo, says which product a printing has. See [0013](docs/decisions/0013-prices-come-from-cardmarket-price-guide.md).

## Price

The Cardmarket trend price of a printing, in euros, as of the day of the price guide it came from. It is the price of the printing's Cardmarket product, so it ignores condition, edition, language, and finish. A printing with no Cardmarket product, or whose product has no trend price in the guide, has no price.

## Not named yet

Wishlist, deck, trade list, and user account. Do not add them as types until a frame gives them a glossary entry.
