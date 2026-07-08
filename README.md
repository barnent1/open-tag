# Open Tag

**An open source framework for bringing an AI agent into your team's conversations — on any platform, with persistent memory, connected to your resources.**

Open Tag lets people converse naturally on the platform they already use (Slack, Discord, Microsoft Teams, and more). When someone tags the agent — `@agent` — the message is picked up and routed to a central system where an AI agent is running and monitoring the channel. The agent responds in-channel, remembers everything, and can act on the resources you connect it to.

## How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Slack     │     │   Discord   │     │   Teams     │   ... any platform
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └────────── @agent mentions ────────────┘
                           │
                  ┌────────▼────────┐
                  │  Central System │
                  │   (AI Agent)    │
                  ├─────────────────┤
                  │ Channel Monitor │
                  │ Persistent      │
                  │ Memory          │
                  │ Resource        │
                  │ Connectors      │
                  └────────┬────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  ┌─────▼─────┐     ┌──────▼──────┐    ┌──────▼──────┐
  │   Repos   │     │  Databases  │    │  APIs/Docs  │   ... your resources
  └───────────┘     └─────────────┘    └─────────────┘
```

1. **Connect a platform.** Install the Open Tag connector for your chat platform and add the agent to one or more channels.
2. **Tag the agent.** Anyone in the channel can write `@agent <request>` — the mention is picked up and passed to the central system.
3. **The agent responds.** A central AI agent monitors every connected channel, processes the request with full conversational context, and replies in the thread.
4. **It remembers.** The agent maintains persistent memory across all channels it belongs to — it always knows what's going on and what has already been discussed.
5. **It's connected.** The agent is wired into a person's or company's resources — codebases, documents, databases, internal APIs — so its answers and actions are grounded in your actual context.

## Key Features

- **Platform-agnostic** — one agent, many surfaces. Connectors translate each platform's events into a common message format, so adding a new platform means writing a connector, not a new agent.
- **Multi-channel awareness** — the agent can be added to any number of channels and keeps a coherent picture across all of them.
- **Persistent memory** — conversations, decisions, and facts are stored durably. The agent never loses the thread, even across restarts or long gaps.
- **Resource connectors** — grant the agent scoped access to the tools and data of a person or company, so it can answer with real information and take real actions.
- **Central orchestration** — a single system-of-record for the agent's behavior, memory, and permissions, regardless of where the conversation happens.
- **Open source, MIT licensed** — self-host it, extend it, build on it.

## Project Status

🚧 **Early development.** The architecture and connector interfaces are being designed. Watch or star the repo to follow along, and open an issue if you'd like to help shape the direction.

## Planned Architecture

| Component | Responsibility |
|---|---|
| **Connectors** | Platform-specific adapters (Slack, Discord, Teams, …) that detect `@agent` mentions and normalize messages |
| **Gateway** | Receives normalized events from connectors and queues them for the agent |
| **Agent Core** | The AI agent loop — reasoning, tool use, response generation |
| **Memory Store** | Durable, searchable memory of every conversation across every channel |
| **Resource Layer** | Pluggable integrations to a person's or company's systems (repos, docs, databases, APIs) |

## Contributing

Contributions are welcome. Open an issue to discuss ideas, report bugs, or propose connectors for new platforms.

## License

[MIT](LICENSE) © 2026 Glen Barnhardt and Barnhardt Enterprises, Inc.
