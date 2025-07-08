# Developer Documentation

## Overview

This VS Code extension allows users to run AWS Athena queries directly from the editor with advanced features like pagination, column resizing, CSV export, and a full schema explorer for the AWS Glue Data Catalog.

## Current Version: 0.1.18

### Key Features
- Direct query execution without automatic modifications
- **Schema Explorer for Glue Catalog**: Browse databases, tables, and columns in a dedicated Activity Bar view
- Run queries directly from the schema explorer with proper Athena SQL syntax
- Pagination with 500 rows per page and progress indicators
- Column resizing functionality
- CSV export for complete results
- Compact, professional UI design
- Loading states and error handling
- Session expiration management
- Non-blocking pagination loading indicators

## Architecture

### Core Components

1. **Extension Entry Point** (`src/extension.ts`)
   - Registers the `athena.runQuery` command
   - Registers and manages the schema explorer view and commands
   - Manages webview panels and message handling
   - Handles pagination and download requests
   - Provides loading states and error handling

2. **Athena Runner** (`src/athena.ts`)
   - AWS SDK integration for Athena queries
   - Pagination logic with token management
   - CSV export functionality
   - Query execution and result formatting

3. **Schema Explorer** (`src/schemaExplorer.ts`)
   - Uses AWS Glue SDK to fetch databases, tables, and columns
   - Implements `vscode.TreeDataProvider` for the explorer view
   - Caches and refreshes schema data
   - Supports context menu actions (run query, refresh)
   - Integrates with the main extension for query execution

### Key Interfaces

```typescript
interface PaginatedResults {
    results: any[];
    totalRows: number;
    totalResultRows?: number; // Total rows in the entire result set
    hasMore: boolean;
    nextToken?: string;
    currentPage: number;
    pageSize: number;
    queryExecutionId?: string;
    pageHistory?: string[];
    canGoBack?: boolean;
    totalPages?: number; // Total number of pages
}

interface QuerySession {
    queryExecutionId: string;
    query: string;
    athenaRunner: AthenaRunner;
}
```

## Development Setup

### Prerequisites
- Node.js 16+ and npm
- VS Code 1.60.0+
- AWS credentials configured

### Installation
```bash
npm install
```

### Development Commands
```bash
npm run compile          # Compile TypeScript
npm run watch            # Watch for changes
npm run vscode:prepublish # Build for packaging
vsce package             # Create .vsix file
```

### Configuration
The extension uses VS Code workspace settings:
- `athena.query.region` - AWS region
- `athena.query.profile` - AWS profile name
- `athena.query.s3OutputLocation` - S3 output location (required)
- `athena.query.database` - Athena database
- `athena.query.workgroup` - Athena workgroup

## Key Features Implementation

### Query Execution
- Queries are executed exactly as written (no automatic LIMIT)
- Uses AWS SDK v3 for Athena operations
- Supports AWS SSO via named profiles
- Loading view shows progress during execution

### Schema Explorer
- Implemented in `src/schemaExplorer.ts`
- Uses AWS Glue SDK to fetch and cache schema
- Implements `vscode.TreeDataProvider` for hierarchical view
- Supports context menu actions (run query, refresh)
- Integrates with the main extension for query execution
- Generates proper Athena SQL syntax with double quotes for identifiers
- To test: open the Athena Schema view, expand databases/tables, right-click a table to run a query

### Pagination
- 500 data rows per page (501 total with header)
- Maintains page history for backward navigation
- Uses Athena's NextToken for efficient pagination
- Progress indicators during page navigation
- Error handling for expired tokens

### Loading States
- Initial query execution shows loading spinner
- Pagination operations show progress notifications
- Non-blocking loading indicators next to pagination buttons
- Table remains visible during pagination operations
- Error states with clear messaging

### Error Handling
- Session expiration detection
- Network error recovery
- Permission error guidance
- User-friendly error messages

### Column Resizing
- Client-side JavaScript handles column resizing
- Resizing persists during pagination
- Minimum width constraints prevent unusable columns

### CSV Export
- Downloads all results without row limits
- Progress tracking with VS Code notifications
- Timestamped file names for easy identification

## Testing

### Manual Testing
1. Configure AWS settings in VS Code
2. Open the Athena Schema view and expand databases/tables/columns
3. Right-click a table and select "Athena: Run Query" to run a sample query
4. Create a SQL file with test queries and run as before
5. Run queries and verify pagination
6. Test column resizing functionality
7. Verify CSV export works correctly
8. Test error scenarios (expired tokens, network issues)

### Test Queries
```sql
-- Test pagination
SELECT * FROM your_table LIMIT 1000;

-- Test large result set
SELECT * FROM your_table;

-- Test with existing LIMIT
SELECT * FROM your_table LIMIT 100;
```

## Building and Packaging

### Local Development
```bash
npm run compile
code --install-extension athena-query-0.1.18.vsix
```

### Production Build
```bash
npm run vscode:prepublish
vsce package
```

## Version History

### Version 0.1.18
- Enhanced testing and documentation updates
- Improved extension packaging and distribution
- Better version management and release process

### Version 0.1.17
- Fixed CSV download path to ensure files are saved in workspace directory
- Added proper absolute path resolution for file downloads
- Improved file naming with timestamps for better organization

### Version 0.1.16
- Fixed "Next" button visibility for schema explorer queries with explicit limits
- Improved pagination logic for limited queries
- Enhanced user experience for quick preview queries

### Version 0.1.15
- Fixed pagination issues with schema explorer queries showing 999 rows instead of 1000
- Adjusted query limits and page sizes for optimal performance
- Improved MaxResults handling to prevent exceeding Athena's 1000 row limit

### Version 0.1.14
- Fixed MaxResults error by reducing to 1000 to comply with Athena limits
- Improved error handling for large result sets
- Enhanced pagination reliability

### Version 0.1.13
- Added schema explorer queries with 100-row limit for quick previews
- Improved query execution from schema explorer context menu
- Enhanced user experience for table exploration

### Version 0.1.12
- Fixed Athena identifier quoting to use double quotes instead of backticks
- Schema explorer queries now use proper Athena SQL syntax
- Resolved "Queries of this type are not supported" errors

### Version 0.1.11
- Fixed Athena identifier quoting to use double quotes instead of backticks
- Schema explorer queries now use proper Athena SQL syntax
- Resolved "Queries of this type are not supported" errors

### Version 0.1.10
- Fixed schema explorer query execution and pagination handlers
- Added complete message handling for queries run from schema explorer
- Ensured full pagination and download support for schema explorer queries

### Version 0.1.9
- Added full schema explorer for AWS Glue Data Catalog
- Browse databases, tables, and columns in the Activity Bar
- Run queries directly from the schema explorer context menu
- Improved integration and documentation

### Version 0.1.8
- Fixed loading indicator to appear next to pagination buttons instead of covering the entire view
- Improved user experience by keeping the table visible during pagination
- Enhanced loading indicator cleanup to prevent UI issues
- Better visual feedback during page navigation operations

### Version 0.1.7
- Added progress indicators for pagination operations
- Implemented comprehensive error handling with snackbar notifications
- Added loading states for query execution and pagination
- Fixed total pages calculation to show actual numbers instead of infinity
- Enhanced user experience with visual feedback during all operations

### Version 0.1.6
- Removed automatic LIMIT clause addition
- Queries now execute exactly as written
- Simplified UI by removing LIMIT indicators
- Updated documentation and README

### Version 0.1.5
- Fixed next/previous button functionality
- Added missing message handlers for pagination
- Improved button onclick function names

### Version 0.1.4
- Smart query preview with automatic LIMIT 500
- Download all results as CSV functionality
- Progress tracking for large downloads

### Version 0.1.3
- Compact table design with 20px row height
- Column resizing functionality
- Modern UI with professional styling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use TypeScript strict mode
- Follow VS Code extension patterns
- Add proper error handling
- Include JSDoc comments for public methods

## Troubleshooting

### Common Issues
- **Compilation errors**: Check TypeScript strict mode compliance
- **AWS credentials**: Verify profile configuration
- **S3 permissions**: Ensure write access to output location
- **Pagination issues**: Check NextToken handling
- **Session expiration**: Tokens expire after 15-30 minutes

### Debug Mode
Enable debug logging by setting:
```json
{
    "athena.query.debug": true
}
```

## License

MIT License - see LICENSE file for details. 