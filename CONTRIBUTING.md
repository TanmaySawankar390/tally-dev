# Contributing to TallyPrime JavaScript SDK

Thank you for your interest in contributing to the TallyPrime JavaScript SDK! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

1. **Search existing issues** first to avoid duplicates
2. **Use the issue templates** when creating new issues
3. **Provide detailed information** including:
   - TallyPrime version
   - SDK version
   - Node.js version
   - Operating system
   - Steps to reproduce
   - Expected vs actual behavior
   - Sample code (if applicable)

### Suggesting Features

1. **Check the roadmap** in README.md to see if it's already planned
2. **Open a feature request** with detailed description
3. **Explain the use case** and why it would benefit users
4. **Consider implementation complexity** and backward compatibility

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch** from `main`
3. **Make your changes** following the coding standards
4. **Add tests** for new functionality
5. **Update documentation** if needed
6. **Submit a pull request**

## 🛠️ Development Setup

### Prerequisites

- Node.js 14+ installed
- TallyPrime installed (for integration testing)
- Git installed

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/tallyprime-js-sdk.git
cd tallyprime-js-sdk

# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Run examples
npm run examples
```

### Project Structure

```
tallyprime-js-sdk/
├── src/                    # Source code
│   ├── connector/         # Connection management
│   ├── services/          # Service classes
│   ├── utils/            # Utilities
│   └── index.js          # Main entry point
├── examples/             # Usage examples
├── test/                 # Test files
├── docs/                 # Documentation
└── README.md            # Main documentation
```

## 📝 Coding Standards

### JavaScript Style

- Use **ES6+ features** (classes, async/await, destructuring)
- Use **4 spaces** for indentation
- Use **single quotes** for strings
- Use **semicolons** at statement ends
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes
- Use **UPPER_CASE** for constants

### Code Organization

- **One class per file** with matching filename
- **Export classes** using both named and default exports
- **Group related functionality** in service classes
- **Use meaningful names** for variables, functions, and classes
- **Keep functions small** and focused on single responsibility

### Documentation

- **JSDoc comments** for all public methods
- **Parameter and return types** clearly documented
- **Usage examples** in JSDoc comments
- **README updates** for new features
- **Inline comments** for complex logic

### Example Code Style

```javascript
/**
 * Create a new ledger in TallyPrime
 * @param {Object} ledgerData - Ledger information
 * @param {string} ledgerData.name - Ledger name
 * @param {string} ledgerData.parent - Parent group
 * @returns {Promise<Object>} Created ledger response
 * 
 * @example
 * const ledger = await createLedger({
 *   name: 'Test Ledger',
 *   parent: 'Sundry Debtors'
 * });
 */
async createLedger(ledgerData) {
    if (!ledgerData.name) {
        throw new Error('Ledger name is required');
    }

    try {
        const xmlData = this._buildLedgerXml(ledgerData);
        const response = await this.connector.sendRequest(xmlData);
        
        return {
            success: true,
            message: `Ledger '${ledgerData.name}' created successfully`,
            data: response.data
        };
    } catch (error) {
        throw new Error(`Failed to create ledger: ${error.message}`);
    }
}
```

## 🧪 Testing Guidelines

### Test Types

1. **Unit Tests** - Test individual functions and methods
2. **Integration Tests** - Test interaction with TallyPrime
3. **Example Tests** - Ensure examples work correctly

### Testing Requirements

- **New features** must include tests
- **Bug fixes** must include regression tests
- **Tests must pass** before submitting PR
- **Coverage** should not decrease significantly

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/services/LedgerService.test.js

# Run with coverage
npm run test:coverage

# Run integration tests (requires TallyPrime)
npm run test:integration
```

## 📚 Documentation Guidelines

### README Updates

- Update **API Reference** for new methods
- Add **examples** for new functionality
- Update **table of contents** if needed
- Keep **changelog** updated

### JSDoc Standards

```javascript
/**
 * Brief description of the method
 * 
 * Detailed description if needed, explaining:
 * - What the method does
 * - When to use it
 * - Any important notes
 * 
 * @param {type} paramName - Parameter description
 * @param {Object} [optionalParam] - Optional parameter
 * @param {string} optionalParam.property - Property description
 * @returns {Promise<type>} Return description
 * @throws {Error} When error occurs
 * 
 * @example
 * // Usage example
 * const result = await method(param);
 * console.log(result);
 * 
 * @since 1.0.0
 */
```

## 🚀 Pull Request Process

### Before Submitting

1. **Ensure tests pass** - Run `npm test`
2. **Check code style** - Run `npm run lint`
3. **Update documentation** - Update README if needed
4. **Test manually** - Run examples to verify functionality
5. **Rebase on main** - Ensure clean git history

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated checks** must pass (tests, linting)
2. **Manual review** by maintainers
3. **Feedback addressed** if requested
4. **Approved and merged** by maintainers

## 🐛 Bug Reports

### Before Reporting

1. **Update to latest version** and test again
2. **Search existing issues** for duplicates
3. **Test with minimal example** to isolate issue
4. **Check TallyPrime configuration** and connectivity

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce the behavior:
1. Initialize SDK with...
2. Call method...
3. See error

**Expected behavior**
What you expected to happen

**Actual behavior**
What actually happened

**Environment:**
- SDK Version: 
- TallyPrime Version: 
- Node.js Version: 
- OS: 

**Additional context**
Any other context about the problem
```

## 🔧 Development Tips

### Debugging

- Use **console.log** for debugging during development
- Use **TallyPrime logs** for API-related issues
- Use **network debugging tools** for connection issues
- Test with **different TallyPrime versions** if possible

### Testing with TallyPrime

1. **Create test company** for development
2. **Use test data** that can be safely modified
3. **Backup data** before destructive operations
4. **Document test scenarios** for consistent testing

### Performance Considerations

- **Minimize API calls** by batching operations
- **Use appropriate timeouts** for different operations
- **Handle large datasets** with pagination
- **Cache results** when appropriate

## 📋 Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality
- **PATCH** version for bug fixes

### Release Steps

1. **Update version** in package.json
2. **Update CHANGELOG.md**
3. **Create release notes**
4. **Tag release** in git
5. **Publish to npm**

## 🤔 Questions?

- **Check the documentation** first
- **Search existing issues** and discussions
- **Ask in GitHub Discussions** for general questions
- **Create an issue** for specific problems

## 🙏 Recognition

Contributors will be:
- **Listed in CONTRIBUTORS.md**
- **Mentioned in release notes**
- **Credited in documentation**

Thank you for contributing to the TallyPrime JavaScript SDK! 🎉