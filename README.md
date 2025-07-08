# AWS Athena Query Extension for VS Code

A VS Code extension that allows you to run AWS Athena queries directly from your editor with advanced features like pagination, column resizing, CSV export, and a full schema explorer for the AWS Glue Data Catalog.

## Features

- **Direct Query Execution**: Run AWS Athena queries directly from VS Code
- **Schema Explorer**: Browse Glue databases, tables, and columns in a dedicated Activity Bar view
- **Run Query from Schema**: Right-click any table in the explorer to run a `SELECT * FROM ... LIMIT 100` query
- **Pagination**: Navigate through large result sets with 500 rows per page
- **Progress Indicators**: Visual feedback during query execution and pagination
- **Error Handling**: Clear error messages with snackbar notifications
- **Column Resizing**: Resize table columns by dragging the edges
- **CSV Export**: Download all query results as CSV files to workspace directory
- **Compact UI**: Professional, modern interface with compact table rows (~20px height)
- **Real-time Results**: View query execution time and result statistics
- **Loading States**: Smooth loading animations and progress tracking

## Installation

1. Download the `.vsix` file from the releases
2. In VS Code, go to Extensions (Ctrl+Shift+X)
3. Click the "..." menu and select "Install from VSIX..."
4. Choose the downloaded file

## Configuration

Add the following to your VS Code settings (`settings.json`):

```json
{
    "athena.query.region": "us-east-1",
    "athena.query.profile": "your-aws-profile",
    "athena.query.s3OutputLocation": "s3://your-bucket/athena-output/",
    "athena.query.database": "your-database",
    "athena.query.workgroup": "your-workgroup"
}
```

## Usage

### Query from Editor
1. Open a SQL file or create a new one
2. Write your AWS Athena query
3. Select the query text (or leave it unselected to run the entire file)
4. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and run "Athena: Run Query"
5. View results in the webview panel

### Schema Explorer
1. Click the **Athena Schema** icon in the Activity Bar (left sidebar)
2. Browse all Glue databases, tables, and columns in a tree view
3. Expand a database to see its tables, and a table to see its columns
4. **Right-click a table** (or use the context menu) and select "Athena: Run Query" to run `SELECT * FROM ... LIMIT 100` for that table
5. The query and results will open in a new editor and results panel
6. Use the refresh button in the schema explorer to reload the schema

## Features in Detail

### Query Execution
- **Loading View**: Shows progress spinner and query preview while executing
- **Execution Time**: Displays how long the query took to complete
- **Error Handling**: Clear error messages if query fails

### Schema Explorer
- **Browse Glue Catalog**: View all databases, tables, and columns in your AWS account
- **Context Menu**: Right-click tables to run queries instantly
- **Refresh**: Use the refresh button to reload schema information

### Pagination
- **500 Rows Per Page**: Consistent page size for optimal performance
- **Progress Indicators**: Visual feedback during page navigation (next to buttons)
- **Error Recovery**: Clear messages when pagination fails (e.g., session expired)
- **Page Information**: Shows current page and total pages
- **Navigation Controls**: Previous/Next buttons with proper state management
- **Non-blocking Loading**: Loading indicator appears next to buttons without hiding the table

### Column Resizing
- Hover over column headers to see resize handles
- Drag to resize columns for better data visibility
- Resizing persists during pagination

### CSV Export
- Click "Download All" to export complete results
- Progress indicator shows download status
- Files are saved with timestamps in your workspace directory
- File naming: `athena_results_YYYY-MM-DDTHH-MM-SS-sssZ.csv`

### Error Handling
- **Session Expiration**: Clear messages when pagination tokens expire
- **Network Errors**: Informative error messages for connectivity issues
- **Permission Errors**: Helpful guidance for AWS permission problems
- **Loading States**: Visual feedback during all operations

## Requirements

- AWS credentials configured (via AWS CLI, IAM roles, or environment variables)
- Appropriate permissions for Athena, Glue, and S3
- VS Code 1.60.0 or higher

## Known Limitations

- Pagination tokens expire after 15-30 minutes (Athena limitation)
- Maximum 1000 rows per API call (Athena limitation)
- Results are paginated in 500-row chunks for optimal performance
- Large result sets may take time to download completely

## Troubleshooting

### Pagination Issues
- **"Session expired"**: Pagination tokens have expired. Re-run the query to continue.
- **"Next page not available"**: You've reached the end of the results or tokens expired.
- **Loading takes too long**: Large queries may take several minutes to execute.

### Common Errors
- **S3 permissions**: Ensure write access to the configured output location
- **AWS credentials**: Verify your AWS profile or credentials are properly configured
- **Query syntax**: Check your SQL syntax in the query preview
- **"Queries of this type are not supported"**: Ensure you're using valid Athena SQL syntax (double quotes for identifiers, not backticks)

### CSV Download Issues
- **"No CSV files found"**: Files are saved in your workspace directory with timestamp names
- **Permission errors**: Ensure write access to your workspace directory
- **File not appearing**: Check the workspace root directory for files named `athena_results_*.csv`

## Developer Commands

For developers working on the extension:

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Build for production
npm run vscode:prepublish

# Package extension
vsce package

# Version management
npm version patch    # 0.1.15 → 0.1.16 (bug fixes)
npm version minor    # 0.1.16 → 0.2.0 (new features)
npm version major    # 0.2.0 → 1.0.0 (breaking changes)

# Install extension locally
code --install-extension athena-query-0.1.18.vsix

# Uninstall extension
code --uninstall-extension athena-query

# Run tests (if available)
npm test

# Lint code
npm run lint
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
- Fixed CSV download path to ensure files are saved in workspace directory
- Added proper absolute path resolution for file downloads
- Improved file naming with timestamps for better organization

### Version 0.1.15
- Fixed "Next" button visibility for schema explorer queries with explicit limits
- Improved pagination logic for limited queries
- Enhanced user experience for quick preview queries

### Version 0.1.14
- Fixed pagination issues with schema explorer queries showing 999 rows instead of 1000
- Adjusted query limits and page sizes for optimal performance
- Improved MaxResults handling to prevent exceeding Athena's 1000 row limit

### Version 0.1.13
- Fixed MaxResults error by reducing to 1000 to comply with Athena limits
- Improved error handling for large result sets
- Enhanced pagination reliability

### Version 0.1.12
- Added schema explorer queries with 100-row limit for quick previews
- Improved query execution from schema explorer context menu
- Enhanced user experience for table exploration

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

See [DEVELOPER.md](DEVELOPER.md) for development setup and contribution guidelines.