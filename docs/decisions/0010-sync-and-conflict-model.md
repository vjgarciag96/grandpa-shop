# Sync and conflict model

Status: open

This is not settled. Do not add last-write-wins, version columns, or offline queues until a frame closes this file.

## Question

When two surfaces edit the same copy, how does the collection converge, and what does the person see?

## Why it is open

Last-write-wins, field merges, and version vectors disagree the moment the phone and the web both edit one card. The skeleton must not pretend that choice is obvious.

## What the frame has to answer

- The unit of sync: one copy, one page, or the whole collection.
- Whether a client may edit while it cannot reach the server.
- Who wins when two edits conflict, and what the losing edit does.
- What the user sees when their edit does not stick.
- How this uses the transport in [0009](0009-realtime-transport.md).

Until both files are accepted, sync work stays on the roadmap and out of the modules.
