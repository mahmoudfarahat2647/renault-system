# Requirements Document

## Introduction

The part status dropdown column in the main sheet currently has display issues where the dropdown arrow remains visible after selection and the selected status doesn't properly display its corresponding color. This feature will fix the dropdown behavior to show the selected status with its proper color and hide the dropdown arrow when a status is selected.

## Requirements

### Requirement 1

**User Story:** As a user, I want the part status dropdown to display the selected status with its corresponding color, so that I can quickly identify the status of each part visually.

#### Acceptance Criteria

1. WHEN a part status is selected from the dropdown THEN the cell SHALL display the status label with its corresponding background color
2. WHEN a part status is selected THEN the cell SHALL show a colored indicator (bullet/badge) matching the status color definition
3. IF no status is selected THEN the cell SHALL display a neutral state with placeholder styling
4. WHEN the status color is defined in settings THEN the cell SHALL use that exact color for the visual indicator

### Requirement 2

**User Story:** As a user, I want the dropdown arrow to be hidden after making a selection, so that the interface appears clean and the selected status is clearly visible.

#### Acceptance Criteria

1. WHEN a part status is selected from the dropdown THEN the dropdown arrow SHALL be hidden
2. WHEN no status is selected THEN the dropdown arrow SHALL be visible to indicate the field is editable
3. WHEN hovering over a cell with a selected status THEN the dropdown arrow MAY appear to indicate editability
4. WHEN the cell is in edit mode THEN the dropdown arrow SHALL be visible

### Requirement 3

**User Story:** As a user, I want the part status cell to maintain consistent visual styling, so that the interface looks professional and cohesive.

#### Acceptance Criteria

1. WHEN displaying a selected status THEN the cell SHALL maintain proper alignment and spacing
2. WHEN the cell is not selected THEN the visual styling SHALL be consistent with other grid cells
3. WHEN the cell contains a status THEN the text SHALL be readable against the background color
4. WHEN the grid is in read-only mode THEN the status cells SHALL display properly without edit indicators