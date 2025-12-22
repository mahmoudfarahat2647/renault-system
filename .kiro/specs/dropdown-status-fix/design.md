# Design Document

## Overview

This design addresses the part status dropdown display issues in the main sheet grid. The current `PartStatusRenderer` component always shows a dropdown arrow and doesn't properly display the selected status with its corresponding color. The solution involves enhancing the renderer to conditionally show UI elements based on the cell's state and properly apply status colors.

## Architecture

The fix will be implemented entirely within the existing AG Grid cell renderer architecture:

- **PartStatusRenderer Component**: Enhanced to handle different display states
- **AG Grid Cell Editor**: Existing `agSelectCellEditor` remains unchanged
- **State Management**: Leverages existing `partStatuses` from the store
- **Styling**: Uses existing Tailwind CSS classes and color definitions

## Components and Interfaces

### Enhanced PartStatusRenderer

The `PartStatusRenderer` component will be redesigned to handle three distinct states:

1. **Empty State**: No status selected
   - Shows dropdown arrow indicator
   - Uses neutral/placeholder styling
   - Indicates the field is editable

2. **Selected State**: Status is selected
   - Shows status label with corresponding color
   - Hides dropdown arrow by default
   - Displays colored indicator (bullet/badge)

3. **Hover/Edit State**: User interaction
   - Shows dropdown arrow on hover (optional enhancement)
   - Maintains edit functionality

### Component Interface

```typescript
interface PartStatusRendererProps extends ICellRendererParams<PendingRow> {
    partStatuses?: PartStatusDef[];
}

interface PartStatusDef {
    id: string;
    label: string;
    color: string; // Tailwind CSS class (e.g., 'bg-emerald-500')
}
```

### Display Logic

The renderer will implement the following logic:

```typescript
const renderContent = () => {
    if (!value || value.trim() === '') {
        // Empty state: show dropdown indicator
        return <EmptyStatusDisplay />;
    } else {
        // Selected state: show status with color
        return <SelectedStatusDisplay status={statusDef} />;
    }
};
```

## Data Models

No changes to existing data models are required. The component will continue to use:

- `PartStatusDef[]` from the store
- `partStatus` field from `PendingRow`
- Existing color definitions (Tailwind CSS classes)

## Error Handling

### Missing Status Definition
- If a selected status is not found in `partStatuses`, display with fallback gray color
- Log warning for debugging purposes
- Maintain functionality without breaking the grid

### Invalid Color Classes
- Fallback to default gray color if color class is invalid
- Ensure text remains readable with proper contrast

### Null/Undefined Values
- Handle empty, null, or undefined status values gracefully
- Display appropriate empty state

## Testing Strategy

### Unit Tests
1. **Renderer State Tests**
   - Test empty state display (shows dropdown arrow)
   - Test selected state display (shows color, hides arrow)
   - Test fallback behavior for missing status definitions

2. **Color Application Tests**
   - Verify correct color is applied for each status
   - Test fallback color for undefined statuses
   - Ensure text contrast and readability

3. **Integration Tests**
   - Test dropdown selection updates the display
   - Verify cell editing functionality remains intact
   - Test read-only mode behavior

### Visual Testing
1. **Cross-browser Compatibility**
   - Verify rendering in different browsers
   - Test color consistency across platforms

2. **Responsive Design**
   - Ensure proper display at different grid column widths
   - Test text truncation if needed

## Implementation Details

### Current Issues Analysis

**Issue 1: Always Visible Dropdown Arrow**
- Current code: `<div className="text-xs text-gray-400 font-bold">▼</div>`
- Problem: Arrow is always rendered regardless of selection state
- Solution: Conditionally render arrow based on value presence

**Issue 2: Color Not Applied to Selected Status**
- Current code: Only shows colored bullet, not the status text/background
- Problem: Selected status doesn't visually indicate its color prominently
- Solution: Apply background color or enhanced visual indicator

### Enhanced Renderer Structure

```typescript
export const PartStatusRenderer = (params: PartStatusRendererProps) => {
    const value = params.value as string;
    const statuses = params.partStatuses || [];
    const statusDef = statuses.find((s: PartStatusDef) => s.label === value);
    
    if (!value || value.trim() === '') {
        // Empty state
        return (
            <div className="flex items-center justify-center h-full w-full gap-1">
                <span className="text-xs text-gray-500">Select status</span>
                <div className="text-xs text-gray-400">▼</div>
            </div>
        );
    }
    
    // Selected state
    const colorClass = statusDef ? statusDef.color : 'bg-gray-400';
    
    return (
        <div className="flex items-center justify-center h-full w-full gap-1">
            <div className={`w-3 h-3 rounded-full ${colorClass} shadow-sm ring-1 ring-black/5`}></div>
            <span className="text-xs text-gray-300 font-medium truncate">{value}</span>
        </div>
    );
};
```

### Styling Considerations

1. **Color Consistency**: Use existing Tailwind color classes from status definitions
2. **Text Readability**: Ensure sufficient contrast between text and background
3. **Grid Integration**: Maintain consistent cell height and alignment
4. **Responsive Design**: Handle text overflow gracefully

### Accessibility

1. **Screen Readers**: Provide appropriate ARIA labels and titles
2. **Keyboard Navigation**: Ensure dropdown remains keyboard accessible
3. **Color Blind Support**: Consider adding text indicators alongside colors
4. **Focus Management**: Maintain proper focus states for editing

## Alternative Approaches Considered

### Option 1: Custom Cell Editor
- **Pros**: Complete control over dropdown behavior
- **Cons**: More complex implementation, potential AG Grid compatibility issues
- **Decision**: Rejected in favor of simpler renderer-only solution

### Option 2: CSS-Only Solution
- **Pros**: Minimal code changes
- **Cons**: Limited control over conditional display logic
- **Decision**: Rejected as it cannot handle the conditional arrow display requirement

### Option 3: Hover-Based Arrow Display
- **Pros**: Clean look when not interacting, discoverable on hover
- **Cons**: May not be obvious to users that cells are editable
- **Decision**: Considered for future enhancement, not included in initial implementation