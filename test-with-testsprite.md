# TestSprite Testing Session for Renault System

This document outlines how to run a test session using TestSprite MCP server with your Renault System project.

## Prerequisites

- MCP-compatible IDE (Cursor, VS Code with MCP extension, Claude, etc.)
- TestSprite MCP server properly configured in `mcp.json`
- Your API key set in the configuration
- Project dependencies installed (`npm install`)

## Starting a Test Session

In your MCP-compatible IDE, you would typically:

1. **Initiate the MCP Server**: The server should start automatically based on your `mcp.json` configuration

2. **Use Natural Language Prompts**: In the IDE's AI assistant, use prompts like:
   ```
   Help me test this project with TestSprite.
   ```

3. **Describe Specific Testing Needs**: You can also use more specific prompts like:
   - "Test the booking calendar functionality"
   - "Validate the order creation workflow"
   - "Check for UI issues in the main sheet"
   - "Test the search functionality"
   - "Verify data grid interactions"

## Expected TestSprite Behavior

When you run a test session with TestSprite, it will:

1. **Analyze Your Codebase**: TestSprite will examine your Next.js application structure
2. **Generate Test Plans**: Create comprehensive test scenarios based on your application features
3. **Execute Tests**: Run tests in secure cloud environments
4. **Provide Results**: Deliver detailed reports with actionable insights
5. **Suggest Fixes**: Offer recommendations for any issues found

## Features to Test in Renault System

Based on your project structure, TestSprite can help test:

### Core Application Pages
- `/booking` - Calendar and booking functionality
- `/orders` - Order management workflows
- `/main-sheet` - Main operational interface
- `/call-list` - Call list management
- `/archive` - Archive functionality

### Components
- Booking calendar grid and sidebar components
- Data grids with AG-Grid integration
- Search functionality
- Dashboard charts and capacity tracking
- Forms and input validation

### State Management
- Zustand store operations
- Inventory slice functionality
- Orders slice operations
- UI state management

## Integration with Existing Tests

Remember that TestSprite complements your existing testing:
- Unit tests: Vitest with React Testing Library
- E2E tests: Playwright
- AI-powered tests: TestSprite

## Running a Sample Test Session

To begin testing, in your MCP-compatible IDE:

1. Open the project in the IDE
2. Make sure the TestSprite MCP server is connected
3. In the AI assistant, type: `Help me test this project with TestSprite.`
4. The AI assistant will then connect to the TestSprite MCP server and begin analyzing your project
5. You'll receive feedback on potential issues and test results

## Example Test Scenarios

Some specific test scenarios you might want to run:

```
"Test the order creation flow from start to finish"
"Validate the booking calendar date selection functionality"
"Check for responsive design issues across different screen sizes"
"Test the data grid filtering and sorting capabilities"
"Verify the search functionality works correctly"
"Test the form validation in the booking sidebar"
```

## Reviewing Results

After TestSprite completes its testing:
- Review the detailed test reports
- Address any issues identified
- Use the AI's suggestions to improve code quality
- Integrate findings with your existing test suites