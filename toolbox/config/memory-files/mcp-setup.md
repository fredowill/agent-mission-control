# MCP Server Setup on Windows

## The `cmd /c` Rule
On Windows, MCP servers that use `npx` MUST be wrapped with `cmd /c`.
`claude mcp add` misparses `/c` as a path — edit `.claude.json` directly instead.

Correct format in `.claude.json`:
```json
{
  "command": "cmd",
  "args": ["/c", "npx -y @some/mcp-package@latest"],
  "env": {}
}
```

## CCLSP (Language Server Protocol)
- Config path via env var `CCLSP_CONFIG_PATH` (not `--config` flag)
- `servers` must be an **array**, not an object
- LSP command must use `cmd.exe /c npx` for Windows child process spawning
- Working config:
```json
{
  "servers": [
    {
      "extensions": ["js", "ts", "jsx", "tsx"],
      "command": ["cmd.exe", "/c", "npx", "-y", "typescript-language-server", "--stdio"],
      "rootDir": "."
    }
  ]
}
```

## Context7
- Straightforward once `cmd /c` wrapper is applied
- No extra config needed
- Add "use context7" to prompts or it activates automatically

## General MCP Debugging
- `claude --debug` shows MCP connection errors
- `/mcp` in session shows status of all servers
- `ENOENT` on Windows = needs `cmd /c` or `.cmd` extension
- `EINVAL` on Windows = child process spawn issue, use `cmd.exe /c` in command array
