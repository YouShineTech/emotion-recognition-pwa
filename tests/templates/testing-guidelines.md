# Manual Testing Guidelines

## Test Case Execution Instructions

### Before Starting Testing

1. **Environment Setup**
   - Ensure you have access to the required browsers (Chrome, Firefox, Safari)
   - Verify device has working camera and microphone
   - Clear browser cache and cookies for clean state testing
   - Have network monitoring tools available if testing performance/network scenarios

2. **Test Case Selection**
   - Start with prerequisite test cases (check Pre-conditions column)
   - Follow the sequence indicated by test dependencies
   - Do not skip failed prerequisite tests

### During Test Execution

1. **Fill Required Fields**
   - **Tester-Name**: Enter your full name
   - **Date-Tested**: Use YYYY-MM-DD format (e.g., 2025-01-09)
   - **Actual-Outcome**: Describe exactly what you observed
   - **Status**: Use Pass/Fail/Blocked only
   - **Comments**: Add any relevant observations, issues, or notes

2. **Step-by-Step Execution**
   - Execute each test step in the exact order listed
   - Wait for each step to complete before proceeding
   - Record actual outcomes immediately after each step
   - Take screenshots for failed steps when possible

3. **Status Guidelines**
   - **Pass**: Expected outcome matches actual outcome exactly
   - **Fail**: Actual outcome differs from expected outcome
   - **Blocked**: Cannot execute due to environment issues or failed prerequisites

### Recording Results

1. **Actual Outcome Field**
   - Be specific and measurable (e.g., "Dialog appeared in 2.1 seconds" not "Dialog appeared quickly")
   - Include error messages verbatim if they occur
   - Note any visual or behavioral differences from expected

2. **Comments Field**
   - Browser version and operating system
   - Device specifications if relevant
   - Network conditions if applicable
   - Any workarounds used
   - Suggestions for improvement

### Test Case Dependencies

- Check **Pre-conditions** before starting any test case
- Ensure prerequisite test cases have passed
- Note **Post-conditions** for dependent test cases
- If a prerequisite fails, mark dependent tests as "Blocked"

### Reporting Issues

When a test fails:

1. Record the exact steps that led to the failure
2. Include error messages, screenshots, or video if possible
3. Note the browser, OS, and device information
4. Attempt to reproduce the issue if time permits
5. Check if the issue occurs in different browsers/devices

### Test Data and Environment

- Use the test data specified in the test case
- Reset to clean state between test cases when required
- Document any deviations from standard test environment
- Ensure test environment matches production as closely as possible

## Quality Standards

- All test cases must be executed completely
- No steps should be skipped unless blocked by prerequisites
- Results must be recorded immediately during execution
- Any ambiguity in test steps should be clarified before execution
- Test execution should be reproducible by other testers

## Test Completion Criteria

A test case is considered complete when:

- All steps have been executed
- All required fields are filled out
- Status is determined (Pass/Fail/Blocked)
- Comments provide sufficient detail for review
- Any failures are properly documented with reproduction steps
