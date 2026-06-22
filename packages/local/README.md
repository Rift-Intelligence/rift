# @rift/local

RIFT Local Sandbox Client - Execute commands on your local machine from RIFT.

## Installation

```bash
npx @rift/local@latest --token YOUR_TOKEN
```

Or install globally:

```bash
npm install -g @rift/local
rift-local --token YOUR_TOKEN
```

## Usage

```bash
npx @rift/local@latest --token hsb_abc123
```

Commands run directly on your host OS. The client connects to RIFT and relays commands in real-time.

## Options

| Option             | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `--token TOKEN`    | Authentication token from RIFT Settings (required)    |
| `--name NAME`      | Optional connection name fallback (default: hostname) |
| `--convex-url URL` | Override backend URL (for development)                |
| `--help, -h`       | Show help message                                     |

## Getting Your Token

1. Go to [RIFT Settings](https://rift.co/settings)
2. Navigate to the "Agents" tab
3. Click "Generate Token" or copy your existing token

## Security

Commands run directly on your OS without any isolation. Only connect machines you trust and control. The client auto-terminates after 1 hour of inactivity.

## License

MIT
