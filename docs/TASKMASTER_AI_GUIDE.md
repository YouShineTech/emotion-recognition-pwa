# Taskmaster AI Integration Guide

This guide explains how to use Taskmaster AI with your emotion-recognition-pwa project for intelligent task management.

## Overview

Taskmaster AI is now integrated into your project through the `@astrotask/mcp` MCP server, providing AI-powered task management capabilities. The system uses a local SQLite database (`taskmaster.db`) to store and manage tasks.

## Quick Start

### 1. Verify Installation

```bash
npm run taskmaster:status
```

### 2. Start the MCP Server (for development)

```bash
npm run taskmaster:dev
```

### 3. Use with AI Assistant

You can now use natural language with your AI assistant to manage tasks:

- "Create a task to implement WebRTC connection handling"
- "List all pending frontend tasks"
- "Mark the authentication task as complete"

## Available Tools

The MCP server provides these tools for task management:

### `createTask`

Create a new task with detailed specifications.

**Parameters:**

- `title` (required): Task title
- `description` (optional): Detailed description
- `status` (optional): `pending`, `in-progress`, `done`, `cancelled`
- `parentId` (optional): Parent task ID for subtasks
- `prd` (optional): Product Requirements Document content
- `contextDigest` (optional): Context information for AI

**Example:**

```json
{
  "name": "createTask",
  "arguments": {
    "title": "Implement WebRTC connection handling",
    "description": "Add WebRTC peer connection setup with proper error handling and reconnection logic",
    "status": "pending"
  }
}
```

### `listTasks`

List tasks with filtering options.

**Parameters:**

- `status` (optional): Filter by status
- `parentId` (optional): Filter by parent task
- `includeSubtasks` (optional): Include nested subtasks

**Example:**

```json
{
  "name": "listTasks",
  "arguments": {
    "status": "pending",
    "includeSubtasks": true
  }
}
```

### `updateTask`

Update existing task properties.

**Parameters:**

- `id` (required): Task ID
- `title` (optional): New title
- `description` (optional): New description
- `status` (optional): New status

**Example:**

```json
{
  "name": "updateTask",
  "arguments": {
    "id": "A",
    "status": "done",
    "description": "Completed WebRTC implementation with all error handling"
  }
}
```

### `completeTask`

Mark a task as complete (convenience method).

**Parameters:**

- `id` (required): Task ID

### `getTaskContext`

Get comprehensive task information including related tasks.

**Parameters:**

- `id` (required): Task ID
- `includeAncestors` (optional): Include parent tasks
- `includeDescendants` (optional): Include child tasks
- `maxDepth` (optional): Maximum hierarchy depth

### `deleteTask`

Delete a task.

**Parameters:**

- `id` (required): Task ID
- `cascade` (optional): Delete subtasks too (default: false)

## Project-Specific Usage

### Recommended Task Categories

Based on your emotion-recognition-pwa project structure:

- **frontend**: Client-side React/TypeScript development
- **backend**: Server-side Node.js/Express development
- **ai-processing**: Emotion recognition AI algorithms
- **webrtc**: WebRTC implementation and optimization
- **devops**: Docker, CI/CD, deployment scripts
- **testing**: Unit tests, integration tests, E2E tests
- **documentation**: README, API docs, user guides

### Example Task Creation Workflow

1. **Create a high-level feature task:**

```
Create task: "Implement real-time emotion detection"
Description: "Add real-time facial emotion detection using OpenCV and TensorFlow.js"
```

2. **Create subtasks:**

```
Create subtask for "Implement real-time emotion detection":
- "Set up OpenCV.js in client"
- "Implement face detection pipeline"
- "Add emotion classification model"
- "Create real-time video processing"
```

3. **Add context to tasks:**

```
Add context to task: Include links to OpenCV.js documentation and emotion model datasets
```

## Configuration Files

### MCP Settings

Location: `~/.config/Cursor/User/globalStorage/saoudrizwan.cline-dev/settings/cline_mcp_settings.json`

### Project Configuration

Location: `./taskmaster.config.json`

Contains project-specific settings and default task templates.

## Database Management

### Backup Database

```bash
npm run taskmaster:backup
```

### Reset Database

```bash
npm run taskmaster:reset
```

### Manual Database Access

The database is a SQLite file at `./taskmaster.db`. You can inspect it with:

```bash
sqlite3 taskmaster.db
```

## Integration with Development Workflow

### Git Integration

Tasks can be linked to git branches and commits by including task IDs in commit messages:

```
git commit -m "A: Implement WebRTC connection handling"
```

### CI/CD Integration

Tasks can be automatically updated based on CI/CD pipeline status using the MCP tools.

### Code Review Integration

Create tasks for code review feedback and link them to specific PRs.

## Advanced Usage

### Task Dependencies

Create dependencies between tasks:

```
Add dependency: Task B depends on Task A
```

### Context Bundling

Tasks can include rich context like:

- Code snippets
- Documentation links
- Design specifications
- Error logs
- Performance metrics

### AI Agent Collaboration

Multiple AI agents can collaborate on tasks by:

- Sharing task context
- Updating task status
- Adding comments and notes
- Creating follow-up tasks

## Troubleshooting

### Common Issues

1. **MCP Server Not Starting**
   - Check Node.js version (>= 18.0.0)
   - Verify database file permissions
   - Check log output with `npm run taskmaster:dev`

2. **Tasks Not Appearing**
   - Ensure MCP server is running
   - Check database file exists
   - Verify MCP configuration

3. **Permission Errors**
   - Ensure write permissions for `./taskmaster.db`
   - Check MCP settings file permissions

### Debug Mode

Enable debug logging:

```bash
npm run taskmaster:dev
```

## Best Practices

1. **Task Granularity**: Create tasks that can be completed in 1-3 days
2. **Clear Descriptions**: Include acceptance criteria in descriptions
3. **Regular Updates**: Keep task status current
4. **Context Rich**: Add relevant links, code snippets, and documentation
5. **Hierarchical Structure**: Use parent/child relationships for complex features

## Examples

### Creating a Feature Task

```
Create task: "Add emotion detection to video stream"
Description: |
  Implement real-time emotion detection overlay on WebRTC video streams.

  Acceptance Criteria:
  - Detect faces in real-time video
  - Classify emotions (happy, sad, angry, surprised, neutral)
  - Display emotion labels as overlay
  - Handle multiple faces simultaneously
  - Performance: < 100ms latency

  Technical Notes:
  - Use OpenCV.js for face detection
  - Use pre-trained TensorFlow.js model for emotion classification
  - Implement efficient frame processing pipeline
```

### Creating Bug Tasks

```
Create task: "Fix WebRTC connection drops on mobile"
Description: |
  Users report frequent WebRTC connection drops on mobile devices.

  Steps to reproduce:
  1. Open app on mobile browser
  2. Start video call
  3. Wait 2-3 minutes
  4. Connection drops unexpectedly

  Expected: Stable connection for > 10 minutes
  Actual: Connection drops after 2-3 minutes

  Priority: High
  Status: pending
```

## Support

For issues with the MCP server itself, refer to:

- [@astrotask/mcp documentation](https://npm.im/@astrotask/mcp)
- [GitHub Issues](https://github.com/astrotask/astrotask/issues)

For project-specific questions, create tasks using the MCP tools and add relevant context.
