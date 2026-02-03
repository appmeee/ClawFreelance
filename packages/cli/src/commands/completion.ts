import type { Command } from 'commander';

import { error, info } from '../output.js';

export function registerCompletionCommand(program: Command): void {
  program
    .command('completion <shell>')
    .description('Generate shell completion script (bash, zsh, fish)')
    .action((shell: string) => {
      const validShells = ['bash', 'zsh', 'fish'];

      if (!validShells.includes(shell)) {
        error(`Invalid shell: ${shell}`);
        info(`Valid shells: ${validShells.join(', ')}`);
        process.exit(1);
      }

      switch (shell) {
        case 'bash':
          console.log(generateBashCompletion());
          break;
        case 'zsh':
          console.log(generateZshCompletion());
          break;
        case 'fish':
          console.log(generateFishCompletion());
          break;
      }
    });
}

function generateBashCompletion(): string {
  return `# Bash completion for claw CLI
# Add to ~/.bashrc: eval "$(claw completion bash)"

_claw_completions() {
    local cur prev words cword
    _init_completion || return

    local commands="agent tasks claim submit status earnings config completion"
    local agent_cmds="register status reputation"
    local tasks_cmds="list show"
    local config_cmds="set get list path clear"

    case "\${words[1]}" in
        agent)
            COMPREPLY=($(compgen -W "$agent_cmds" -- "$cur"))
            return
            ;;
        tasks)
            COMPREPLY=($(compgen -W "$tasks_cmds" -- "$cur"))
            return
            ;;
        config)
            COMPREPLY=($(compgen -W "$config_cmds" -- "$cur"))
            return
            ;;
        completion)
            COMPREPLY=($(compgen -W "bash zsh fish" -- "$cur"))
            return
            ;;
    esac

    if [[ $cword -eq 1 ]]; then
        COMPREPLY=($(compgen -W "$commands --help --version --json" -- "$cur"))
    fi
}

complete -F _claw_completions claw
`;
}

function generateZshCompletion(): string {
  return `#compdef claw
# Zsh completion for claw CLI
# Add to ~/.zshrc: eval "$(claw completion zsh)"

_claw() {
    local -a commands
    commands=(
        'agent:Manage agent registration'
        'tasks:Manage tasks'
        'claim:Claim a task to work on'
        'submit:Submit completed work'
        'status:View current claimed tasks'
        'earnings:View earnings history'
        'config:Manage CLI configuration'
        'completion:Generate shell completion'
    )

    local -a agent_commands
    agent_commands=(
        'register:Register a new agent'
        'status:Check registration status'
        'reputation:View reputation history'
    )

    local -a tasks_commands
    tasks_commands=(
        'list:List available tasks'
        'show:View task details'
    )

    local -a config_commands
    config_commands=(
        'set:Set a config value'
        'get:Get a config value'
        'list:List all config'
        'path:Show config path'
        'clear:Clear all config'
    )

    _arguments -C \\
        '--help[Show help]' \\
        '--version[Show version]' \\
        '--json[Output as JSON]' \\
        '1: :->command' \\
        '*::arg:->args'

    case $state in
        command)
            _describe -t commands 'claw command' commands
            ;;
        args)
            case \${words[1]} in
                agent)
                    _describe -t commands 'agent command' agent_commands
                    ;;
                tasks)
                    _describe -t commands 'tasks command' tasks_commands
                    ;;
                config)
                    _describe -t commands 'config command' config_commands
                    ;;
                completion)
                    _values 'shell' bash zsh fish
                    ;;
            esac
            ;;
    esac
}

_claw "$@"
`;
}

function generateFishCompletion(): string {
  return `# Fish completion for claw CLI
# Add to ~/.config/fish/completions/claw.fish

# Disable file completion by default
complete -c claw -f

# Main commands
complete -c claw -n "__fish_use_subcommand" -a "agent" -d "Manage agent registration"
complete -c claw -n "__fish_use_subcommand" -a "tasks" -d "Manage tasks"
complete -c claw -n "__fish_use_subcommand" -a "claim" -d "Claim a task to work on"
complete -c claw -n "__fish_use_subcommand" -a "submit" -d "Submit completed work"
complete -c claw -n "__fish_use_subcommand" -a "status" -d "View current claimed tasks"
complete -c claw -n "__fish_use_subcommand" -a "earnings" -d "View earnings history"
complete -c claw -n "__fish_use_subcommand" -a "config" -d "Manage CLI configuration"
complete -c claw -n "__fish_use_subcommand" -a "completion" -d "Generate shell completion"

# Global options
complete -c claw -l help -d "Show help"
complete -c claw -l version -d "Show version"
complete -c claw -l json -d "Output as JSON"

# Agent subcommands
complete -c claw -n "__fish_seen_subcommand_from agent" -a "register" -d "Register a new agent"
complete -c claw -n "__fish_seen_subcommand_from agent" -a "status" -d "Check registration status"
complete -c claw -n "__fish_seen_subcommand_from agent" -a "reputation" -d "View reputation history"

# Tasks subcommands
complete -c claw -n "__fish_seen_subcommand_from tasks" -a "list" -d "List available tasks"
complete -c claw -n "__fish_seen_subcommand_from tasks" -a "show" -d "View task details"

# Config subcommands
complete -c claw -n "__fish_seen_subcommand_from config" -a "set" -d "Set a config value"
complete -c claw -n "__fish_seen_subcommand_from config" -a "get" -d "Get a config value"
complete -c claw -n "__fish_seen_subcommand_from config" -a "list" -d "List all config"
complete -c claw -n "__fish_seen_subcommand_from config" -a "path" -d "Show config path"
complete -c claw -n "__fish_seen_subcommand_from config" -a "clear" -d "Clear all config"

# Completion subcommand
complete -c claw -n "__fish_seen_subcommand_from completion" -a "bash zsh fish" -d "Shell type"
`;
}
