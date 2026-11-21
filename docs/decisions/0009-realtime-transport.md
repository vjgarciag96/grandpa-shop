# Real-time transport

Status: open

This is not settled. Do not add a WebSocket, a server-sent-events stream, or another live channel until a frame closes this file.

## Question

Which transport carries a live update between the server, the web app, the installed window, and the phone: WebSockets, server-sent events, or something else?

## Why it is open

A change on any surface is supposed to show up on the others, and the transport shapes the server and both clients. Picking it inside the skeleton would skip the frame.

## What the frame has to answer

- Whether the client only listens, or also sends edits on the same channel.
- How a client authenticates on the stream. Authentication itself is not framed yet.
- What happens on disconnect and reconnect, and what the user sees in that gap.
- How this relates to the conflict model in [0010](0010-sync-and-conflict-model.md). Do not close one and leave the other implicit.
