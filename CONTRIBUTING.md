# Contributing to AI-Powered Threat Detector Extension

Thank you for your interest in contributing to the AI-Powered Threat Detector Extension! We welcome contributions from the community and are grateful for your support.

## 🤝 How to Contribute

### Ways to Contribute

- **🐛 Bug Reports**: Report issues and bugs you encounter
- **💡 Feature Requests**: Suggest new features or improvements
- **📝 Documentation**: Improve documentation and guides
- **🔧 Code Contributions**: Submit pull requests with fixes or features
- **🧪 Testing**: Help test new features and report feedback
- **🎨 UI/UX**: Improve the user interface and experience
- **🔒 Security**: Report security vulnerabilities responsibly

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git for version control
- Chrome browser for testing
- Basic knowledge of JavaScript/TypeScript, React, and browser extensions

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/IDS.git
   cd IDS/threat-detector-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development**
   ```bash
   npm run dev
   ```

4. **Build extension for testing**
   ```bash
   npm run build:extension
   ```

## 📋 Development Guidelines

### Code Standards

- **Language**: Use TypeScript for new code
- **Formatting**: Follow the ESLint configuration
- **Comments**: Write clear, descriptive comments
- **Testing**: Include tests for new features
- **Documentation**: Update documentation for changes

### Commit Message Format

Use conventional commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(ai): add TensorFlow.js URL classification model
fix(popup): resolve service worker communication issue
docs(readme): update installation instructions
```

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation updates
- `refactor/component-name` - Code refactoring

## 🔧 Development Process

### 1. Create an Issue

Before starting work, create an issue to discuss:
- Bug reports with reproduction steps
- Feature requests with detailed descriptions
- Questions about implementation

### 2. Fork and Branch

```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/IDS.git
cd IDS

# Create a new branch
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Write clean, well-documented code
- Follow existing code patterns and conventions
- Add tests for new functionality
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run linting
npm run lint

# Build and test extension
npm run build:extension

# Test in Chrome browser
# Load unpacked extension from extension/ directory
```

### 5. Submit Pull Request

- Push your branch to your fork
- Create a pull request with:
  - Clear title and description
  - Reference related issues
  - Screenshots for UI changes
  - Testing instructions

## 🧪 Testing Guidelines

### Extension Testing

1. **Load Extension**
   - Build with `npm run build:extension`
   - Load unpacked in Chrome
   - Test all functionality

2. **Test Scenarios**
   - Visit various websites
   - Test threat detection
   - Verify popup functionality
   - Check settings persistence

3. **Performance Testing**
   - Monitor memory usage
   - Check response times
   - Verify no memory leaks

### Code Testing

- Write unit tests for new functions
- Test API integrations
- Verify error handling
- Test edge cases

## 🔒 Security Guidelines

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security concerns privately
2. Include detailed reproduction steps
3. Allow time for investigation and fixes
4. Follow responsible disclosure practices

### Security Best Practices

- Validate all user inputs
- Use HTTPS for all API calls
- Implement proper error handling
- Follow Chrome extension security guidelines
- Regular security audits

## 📝 Documentation

### What to Document

- New features and APIs
- Configuration options
- Installation procedures
- Troubleshooting guides
- Code examples

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up-to-date

## 🎯 Priority Areas

We especially welcome contributions in these areas:

### High Priority
- **AI Model Improvements**: Enhance TensorFlow.js models
- **Performance Optimization**: Reduce memory usage and improve speed
- **API Integration**: Add new threat intelligence sources
- **Testing**: Comprehensive test coverage

### Medium Priority
- **UI/UX Enhancements**: Improve user interface
- **Documentation**: Expand user and developer guides
- **Accessibility**: Improve accessibility features
- **Internationalization**: Add multi-language support

### Low Priority
- **Code Refactoring**: Improve code organization
- **Build Process**: Optimize build and deployment
- **Developer Tools**: Enhance development experience

## 📞 Getting Help

### Community Support

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs and request features
- **Documentation**: Check existing guides and FAQs

### Maintainer Contact

- Create an issue for technical questions
- Use discussions for general questions
- Follow the security policy for security issues

## 🏆 Recognition

Contributors will be recognized in:
- README.md acknowledgments
- Release notes for significant contributions
- GitHub contributor statistics

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to making the internet safer! 🛡️
